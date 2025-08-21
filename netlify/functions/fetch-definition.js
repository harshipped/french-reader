// This is a Node.js function that will run on Netlify's servers.

const fetch = require('node-fetch');

// --- Helper function to call the Oxford API ---
const fetchFromOxford = async (word, APP_ID, APP_KEY) => {
  const language = 'fr';
  const endpoint = `https://od-api.oxforddictionaries.com/api/v2/entries/${language}/${word}`;
  const response = await fetch(endpoint, {
    headers: { 'app_id': APP_ID, 'app_key': APP_KEY },
  });

  if (!response.ok) {
    throw new Error(`Oxford API failed with status: ${response.status}`);
  }
  
  const data = await response.json();
  // --- Normalize Oxford API data to a standard format ---
  const result = data.results[0];
  const lexicalEntry = result.lexicalEntries[0];
  const pronunciation = lexicalEntry.entries[0].pronunciations.find(p => p.audioFile);
  
  const definitions = [];
  lexicalEntry.entries.forEach(entry => {
    entry.senses.forEach(sense => {
      if (sense.definitions) {
        definitions.push({
          partOfSpeech: lexicalEntry.lexicalCategory.text,
          definition: sense.definitions[0],
          example: sense.examples ? sense.examples[0].text : null
        });
      }
    });
  });

  return {
    word: result.word,
    phonetic: pronunciation?.phoneticSpelling || '',
    audioUrl: pronunciation?.audioFile || null,
    definitions: definitions
  };
};

// --- Helper function to call the fallback Free Dictionary API ---
const fetchFromFallback = async (word) => {
  const endpoint = `https://api.dictionaryapi.dev/api/v2/entries/fr/${word}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Fallback API failed with status: ${response.status}`);
  }

  const data = await response.json();
  // --- Normalize Fallback API data to the same standard format ---
  const wordData = data[0];
  const phoneticWithAudio = wordData.phonetics.find(p => p.audio);

  const definitions = [];
  wordData.meanings.forEach(meaning => {
    meaning.definitions.forEach(def => {
      definitions.push({
        partOfSpeech: meaning.partOfSpeech,
        definition: def.definition,
        example: def.example || null
      });
    });
  });

  return {
    word: wordData.word,
    phonetic: wordData.phonetic || '',
    audioUrl: phoneticWithAudio ? phoneticWithAudio.audio : null,
    definitions: definitions
  };
};


exports.handler = async function (event, context) {
  const originalWord = event.queryStringParameters.word;
  if (!originalWord) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Word parameter is missing' }) };
  }

  const APP_ID = process.env.OED_APP_ID;
  const APP_KEY = process.env.OED_APP_KEY;

  const wordsToTry = [originalWord];
  // Add singular form if the word is likely a plural
  if (originalWord.endsWith('s')) {
    wordsToTry.push(originalWord.slice(0, -1));
  }
  // Add more rules here in the future if needed (e.g., for verb conjugations)

  for (const word of wordsToTry) {
    try {
      // --- Attempt 1: Try the high-quality Oxford API first ---
      const oxfordData = await fetchFromOxford(word, APP_ID, APP_KEY);
      console.log(`Successfully found "${word}" with Oxford API.`);
      return { statusCode: 200, body: JSON.stringify(oxfordData) };
    } catch (oxfordError) {
      console.log(`Oxford API failed for "${word}". Trying fallback...`);
      try {
        // --- Attempt 2: If Oxford fails, try the fallback API ---
        const fallbackData = await fetchFromFallback(word);
        console.log(`Successfully found "${word}" with Fallback API.`);
        return { statusCode: 200, body: JSON.stringify(fallbackData) };
      } catch (fallbackError) {
        console.log(`Fallback API also failed for "${word}".`);
        // Continue to the next word in the wordsToTry array
      }
    }
  }

  // If all attempts for all word forms fail
  console.log(`Could not find a definition for "${originalWord}" using any method.`);
  return {
    statusCode: 404,
    body: JSON.stringify({ error: `No definition found for "${originalWord}"` }),
  };
};
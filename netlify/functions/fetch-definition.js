// netlify/functions/fetch-definition.js
// Enhanced version with external French dictionary API and audio

const https = require('https');
const http = require('http');

// Fallback local dictionary for common words (in case API fails)
const fallbackDictionary = [
  {
    "french_word": "puis",
    "english_word": "then",
    "french_word_example": "D'abord nous mangeons, puis nous partons.",
    "english_word_example": "First we eat, then we leave."
  },
  {
    "french_word": "dans",
    "english_word": "in",
    "french_word_example": "Les animaux sauvages vivent dans la forêt.",
    "english_word_example": "Wild animals live in the forest."
  },
  {
    "french_word": "bonjour",
    "english_word": "hello",
    "french_word_example": "Bonjour, comment allez-vous ?",
    "english_word_example": "Hello, how are you?"
  },
  {
    "french_word": "merci",
    "english_word": "thank you",
    "french_word_example": "Merci beaucoup pour votre aide.",
    "english_word_example": "Thank you very much for your help."
  },
  {
    "french_word": "vous",
    "english_word": "you",
    "french_word_example": "Comment vous appelez-vous ?",
    "english_word_example": "What is your name?"
  }
];

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Function to get word definition from external API
async function getWordDefinitionFromAPI(word) {
  try {
    // Try French Wiktionary API first
    const wiktionaryUrl = `https://fr.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
    
    try {
      const wiktionaryResult = await makeRequest(wiktionaryUrl);
      if (wiktionaryResult && wiktionaryResult.fr && wiktionaryResult.fr[0]) {
        const definition = wiktionaryResult.fr[0];
        return {
          word: word,
          definition: definition.definition || 'Definition available',
          example: definition.examples && definition.examples[0] ? definition.examples[0].text : `Exemple avec ${word}`,
          source: 'wiktionary'
        };
      }
    } catch (wiktionaryError) {
      console.log('Wiktionary failed, trying alternative...');
    }

    // Try alternative: French Dictionary API
    const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/fr/${encodeURIComponent(word)}`;
    
    try {
      const dictResult = await makeRequest(dictUrl);
      if (dictResult && dictResult[0]) {
        const entry = dictResult[0];
        const meaning = entry.meanings && entry.meanings[0];
        const definition = meaning && meaning.definitions && meaning.definitions[0];
        
        return {
          word: entry.word || word,
          definition: definition ? definition.definition : 'Définition disponible',
          example: definition && definition.example ? definition.example : `Exemple avec ${word}`,
          phonetic: entry.phonetic || '',
          audio: entry.phonetics && entry.phonetics.find(p => p.audio) ? entry.phonetics.find(p => p.audio).audio : null,
          source: 'dictionary'
        };
      }
    } catch (dictError) {
      console.log('Dictionary API failed, using fallback...');
    }

    // Try Google Translate API (free endpoint) as last resort
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=en&dt=t&q=${encodeURIComponent(word)}`;
    
    try {
      const translateResult = await makeRequest(translateUrl);
      if (translateResult && translateResult[0] && translateResult[0][0]) {
        const translation = translateResult[0][0][0];
        return {
          word: word,
          definition: translation,
          example: `Exemple: ${word} dans une phrase.`,
          source: 'translate'
        };
      }
    } catch (translateError) {
      console.log('All APIs failed, using fallback dictionary');
    }

    return null;
  } catch (error) {
    console.error('API request failed:', error);
    return null;
  }
}

// Function to search fallback dictionary
function searchFallbackDictionary(word) {
  const cleanedWord = word.toLowerCase();
  
  let foundEntry = fallbackDictionary.find(entry => 
    entry.french_word.toLowerCase() === cleanedWord
  );

  if (!foundEntry && cleanedWord.endsWith('s')) {
    const singularWord = cleanedWord.slice(0, -1);
    foundEntry = fallbackDictionary.find(entry => 
      entry.french_word.toLowerCase() === singularWord
    );
  }

  return foundEntry;
}

exports.handler = async function (event, context) {
  console.log('Function called with:', event.queryStringParameters);
  
  const originalWord = event.queryStringParameters?.word;
  if (!originalWord) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Word parameter is missing' }),
    };
  }

  const cleanedWord = originalWord.toLowerCase().trim();
  console.log('Looking up word:', cleanedWord);

  // Try external API first
  let wordData = await getWordDefinitionFromAPI(cleanedWord);
  
  // If API fails, try fallback dictionary
  if (!wordData) {
    const fallbackEntry = searchFallbackDictionary(cleanedWord);
    if (fallbackEntry) {
      wordData = {
        word: fallbackEntry.french_word,
        definition: fallbackEntry.english_word,
        example: fallbackEntry.french_word_example,
        source: 'fallback'
      };
    }
  }

  if (wordData) {
    // Format response to match frontend expectations
    const responseData = {
      results: [{
        word: wordData.word,
        phonetic: wordData.phonetic || '',
        audio: wordData.audio || null,
        lexicalEntries: [{
          entries: [{
            senses: [{
              definitions: [wordData.definition],
              examples: [{
                text: wordData.example
              }]
            }]
          }]
        }]
      }]
    };

    console.log('Returning successful response for:', wordData.word, 'from:', wordData.source);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(responseData),
    };
  } else {
    // No definition found anywhere
    console.log('No definition found for:', originalWord);
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: `No definition found for "${originalWord}"`,
        searched_for: cleanedWord,
        suggestion: 'Try checking the spelling or try a different word form'
      }),
    };
  }
};
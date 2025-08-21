// This function reads from a local JSON dictionary file with a more complex structure.

const fs = require('fs');
const path = require('path');

// Load the array of dictionary objects from the JSON file.
const dictionaryPath = path.resolve(__dirname, 'dictionary.json');
const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));

exports.handler = async function (event, context) {
  const originalWord = event.queryStringParameters.word;
  if (!originalWord) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Word parameter is missing' }),
    };
  }

  const cleanedWord = originalWord.toLowerCase();

  // --- Search Strategy ---
  let foundEntry = null;

  // 1. Look for the exact word (case-insensitive)
  foundEntry = dictionary.find(entry => entry.french_word.toLowerCase() === cleanedWord);

  // 2. If not found, try the singular form (if applicable)
  if (!foundEntry && cleanedWord.endsWith('s')) {
    const singularWord = cleanedWord.slice(0, -1);
    foundEntry = dictionary.find(entry => entry.french_word.toLowerCase() === singularWord);
  }

  if (foundEntry) {
    // If an entry is found, format it for the frontend.
    const responseData = {
      word: originalWord,
      phonetic: '', // No phonetic data in this dictionary
      audioUrl: null, // No audio data
      definitions: [{
        partOfSpeech: 'definition', // Generic part of speech
        definition: foundEntry.english_word,
        example: foundEntry.french_word_example // Use the French example
      }]
    };
    return {
      statusCode: 200,
      body: JSON.stringify(responseData),
    };
  } else {
    // If no definition is found after all checks, return a 404 error.
    return {
      statusCode: 404,
      body: JSON.stringify({ error: `No definition found for "${originalWord}"` }),
    };
  }
};

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

  // 3. If still not found, try removing common French endings
  if (!foundEntry) {
    const commonEndings = ['ent', 'es', 'er', 'ez', 'ons', 'ont', 'ais', 'ait', 'aient'];
    for (const ending of commonEndings) {
      if (cleanedWord.endsWith(ending) && cleanedWord.length > ending.length + 2) {
        const rootWord = cleanedWord.slice(0, -ending.length);
        foundEntry = dictionary.find(entry => entry.french_word.toLowerCase().startsWith(rootWord));
        if (foundEntry) break;
      }
    }
  }

  if (foundEntry) {
    // Format the response to match what the frontend expects
    const responseData = {
      results: [{
        word: foundEntry.french_word,
        lexicalEntries: [{
          entries: [{
            senses: [{
              definitions: [foundEntry.english_word],
              examples: [{
                text: foundEntry.french_word_example
              }]
            }]
          }]
        }]
      }]
    };

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
    // If no definition is found after all checks, return a 404 error.
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: `No definition found for "${originalWord}"` }),
    };
  }
};
// netlify/functions/fetch-definition.js
// This function reads from a local JSON dictionary file

const fs = require('fs');
const path = require('path');

// The dictionary.json should be in the same directory as this function
const dictionaryPath = path.resolve(__dirname, 'dictionary.json');

let dictionary;
try {
  dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
  console.log(`Dictionary loaded with ${dictionary.length} entries`);
} catch (error) {
  console.error('Error loading dictionary:', error);
  dictionary = [];
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

  // --- Search Strategy ---
  let foundEntry = null;

  // 1. Look for the exact word (case-insensitive)
  foundEntry = dictionary.find(entry => 
    entry.french_word.toLowerCase() === cleanedWord
  );
  
  if (foundEntry) {
    console.log('Found exact match:', foundEntry.french_word);
  }

  // 2. If not found, try the singular form (if applicable)
  if (!foundEntry && cleanedWord.endsWith('s')) {
    const singularWord = cleanedWord.slice(0, -1);
    foundEntry = dictionary.find(entry => 
      entry.french_word.toLowerCase() === singularWord
    );
    if (foundEntry) {
      console.log('Found singular match:', foundEntry.french_word);
    }
  }

  // 3. If still not found, try removing common French endings
  if (!foundEntry) {
    const commonEndings = ['ent', 'es', 'er', 'ez', 'ons', 'ont', 'ais', 'ait', 'aient', 'e'];
    for (const ending of commonEndings) {
      if (cleanedWord.endsWith(ending) && cleanedWord.length > ending.length + 2) {
        const rootWord = cleanedWord.slice(0, -ending.length);
        foundEntry = dictionary.find(entry => 
          entry.french_word.toLowerCase().startsWith(rootWord)
        );
        if (foundEntry) {
          console.log('Found root match:', foundEntry.french_word, 'for root:', rootWord);
          break;
        }
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

    console.log('Returning successful response for:', foundEntry.french_word);
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
        dictionary_size: dictionary.length
      }),
    };
  }
};
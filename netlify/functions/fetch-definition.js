// netlify/functions/fetch-definition.js
// Debug version with better error handling

const fs = require('fs');
const path = require('path');

let dictionary = [];
let loadError = null;

// Try multiple possible paths for the dictionary
const possiblePaths = [
  path.resolve(__dirname, 'dictionary.json'),           // Same directory
  path.resolve(__dirname, '../dictionary.json'),       // Parent directory
  path.resolve(__dirname, '../../dictionary.json'),    // Project root
  path.resolve(process.cwd(), 'dictionary.json'),      // Process working directory
  path.resolve(process.cwd(), 'netlify/functions/dictionary.json')
];

for (const dictPath of possiblePaths) {
  try {
    if (fs.existsSync(dictPath)) {
      const fileContent = fs.readFileSync(dictPath, 'utf8');
      dictionary = JSON.parse(fileContent);
      console.log(`Dictionary loaded successfully from: ${dictPath}`);
      console.log(`Dictionary has ${dictionary.length} entries`);
      break;
    } else {
      console.log(`Dictionary not found at: ${dictPath}`);
    }
  } catch (error) {
    console.error(`Error reading dictionary from ${dictPath}:`, error.message);
    loadError = error.message;
  }
}

if (dictionary.length === 0) {
  console.error('Failed to load dictionary from all possible paths');
  console.error('Current working directory:', process.cwd());
  console.error('Function directory:', __dirname);
  
  // List files in the function directory for debugging
  try {
    const files = fs.readdirSync(__dirname);
    console.log('Files in function directory:', files);
  } catch (e) {
    console.error('Cannot read function directory:', e.message);
  }
}

exports.handler = async function (event, context) {
  console.log('Function called with:', event.queryStringParameters);
  
  // Add debug info to response if dictionary is empty
  if (dictionary.length === 0) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Dictionary failed to load',
        debug_info: {
          function_dir: __dirname,
          working_dir: process.cwd(),
          load_error: loadError,
          attempted_paths: possiblePaths
        }
      })
    };
  }
  
  const originalWord = event.queryStringParameters?.word;
  if (!originalWord) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Word parameter is missing' }),
    };
  }

  const cleanedWord = originalWord.toLowerCase().trim();
  console.log('Looking up word:', cleanedWord);

  // Search for the word
  let foundEntry = dictionary.find(entry => 
    entry.french_word && entry.french_word.toLowerCase() === cleanedWord
  );

  if (!foundEntry && cleanedWord.endsWith('s')) {
    const singularWord = cleanedWord.slice(0, -1);
    foundEntry = dictionary.find(entry => 
      entry.french_word && entry.french_word.toLowerCase() === singularWord
    );
  }

  if (foundEntry) {
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
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(responseData),
    };
  } else {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: `No definition found for "${originalWord}"`,
        searched_for: cleanedWord,
        dictionary_size: dictionary.length,
        sample_words: dictionary.slice(0, 5).map(entry => entry.french_word)
      }),
    };
  }
};
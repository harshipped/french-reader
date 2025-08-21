// This is a Node.js function that will run on Netlify's servers.

// Using require() for Node.js environment
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  // Get the word from the query parameter (e.g., /api/fetch-definition?word=bonjour)
  const word = event.queryStringParameters.word;
  if (!word) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Word parameter is missing' }),
    };
  }

  // Securely access your API keys from Netlify's environment variables
  const APP_ID = process.env.OED_APP_ID;
  const APP_KEY = process.env.OED_APP_KEY;

  const language = 'fr';
  const endpoint = `https://od-api.oxforddictionaries.com/api/v2/entries/${language}/${word}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        'app_id': APP_ID,
        'app_key': APP_KEY,
      },
    });

    if (!response.ok) {
      // Forward the error from the Oxford API
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Oxford API error: ${response.statusText}` }),
      };
    }

    const data = await response.json();

    // Send the successful response back to the browser
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An internal error occurred.' }),
    };
  }
};

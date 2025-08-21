// netlify/functions/fetch-definition.js
// Function with embedded dictionary to avoid file path issues

// Embedded dictionary - no external file needed
const dictionary = [
  {
    "french_word": "jeunesse",
    "english_word": "youth",
    "french_word_example": "La jeunesse est la puissance du pays.",
    "english_word_example": "The youth is the power of the country."
  },
  {
    "french_word": "zèbre",
    "english_word": "zebra",
    "french_word_example": "Nous sommes allés au parc national pour voir les zèbres.",
    "english_word_example": "We went to the national park to see zebras."
  },
  {
    "french_word": "zéro",
    "english_word": "zero",
    "french_word_example": "Je ne veux pas que tu aies zéro à l'interrogation.",
    "english_word_example": "I don't want you to get zero on the test."
  },
  {
    "french_word": "sauvages",
    "english_word": "wild",
    "french_word_example": "Les animaux sauvages vivent dans la forêt.",
    "english_word_example": "Wild animals live in the forest."
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
    "french_word": "au",
    "english_word": "to the",
    "french_word_example": "Je vais au marché.",
    "english_word_example": "I'm going to the market."
  },
  {
    "french_word": "revoir",
    "english_word": "goodbye",
    "french_word_example": "Au revoir et à bientôt !",
    "english_word_example": "Goodbye and see you soon!"
  },
  {
    "french_word": "merci",
    "english_word": "thank you",
    "french_word_example": "Merci beaucoup pour votre aide.",
    "english_word_example": "Thank you very much for your help."
  },
  {
    "french_word": "s'il",
    "english_word": "if",
    "french_word_example": "S'il vous plaît, aidez-moi.",
    "english_word_example": "Please, help me."
  },
  {
    "french_word": "vous",
    "english_word": "you",
    "french_word_example": "Comment vous appelez-vous ?",
    "english_word_example": "What is your name?"
  },
  {
    "french_word": "plaît",
    "english_word": "please",
    "french_word_example": "S'il vous plaît, aidez-moi.",
    "english_word_example": "Please, help me."
  },
  {
    "french_word": "oui",
    "english_word": "yes",
    "french_word_example": "Oui, je comprends.",
    "english_word_example": "Yes, I understand."
  },
  {
    "french_word": "non",
    "english_word": "no",
    "french_word_example": "Non, je ne sais pas.",
    "english_word_example": "No, I don't know."
  },
  {
    "french_word": "excuse",
    "english_word": "excuse",
    "french_word_example": "Excusez-moi, où est la gare ?",
    "english_word_example": "Excuse me, where is the train station?"
  },
  {
    "french_word": "moi",
    "english_word": "me",
    "french_word_example": "Excusez-moi, s'il vous plaît.",
    "english_word_example": "Excuse me, please."
  },
  {
    "french_word": "parlez",
    "english_word": "speak",
    "french_word_example": "Parlez-vous français ?",
    "english_word_example": "Do you speak French?"
  },
  {
    "french_word": "français",
    "english_word": "French",
    "french_word_example": "J'apprends le français.",
    "english_word_example": "I am learning French."
  },
  {
    "french_word": "anglais",
    "english_word": "English",
    "french_word_example": "Je parle anglais.",
    "english_word_example": "I speak English."
  },
  {
    "french_word": "comprends",
    "english_word": "understand",
    "french_word_example": "Je ne comprends pas.",
    "english_word_example": "I don't understand."
  },
  {
    "french_word": "pas",
    "english_word": "not",
    "french_word_example": "Je ne comprends pas.",
    "english_word_example": "I don't understand."
  },
  {
    "french_word": "sais",
    "english_word": "know",
    "french_word_example": "Je ne sais pas.",
    "english_word_example": "I don't know."
  },
  {
    "french_word": "comment",
    "english_word": "how",
    "french_word_example": "Comment ça va ?",
    "english_word_example": "How are you?"
  },
  {
    "french_word": "allez",
    "english_word": "go",
    "french_word_example": "Comment allez-vous ?",
    "english_word_example": "How are you?"
  },
  {
    "french_word": "appelez",
    "english_word": "call",
    "french_word_example": "Comment vous appelez-vous ?",
    "english_word_example": "What is your name?"
  },
  {
    "french_word": "eau",
    "english_word": "water",
    "french_word_example": "Je voudrais un verre d'eau.",
    "english_word_example": "I would like a glass of water."
  },
  {
    "french_word": "pain",
    "english_word": "bread",
    "french_word_example": "J'achète du pain à la boulangerie.",
    "english_word_example": "I buy bread at the bakery."
  },
  {
    "french_word": "lait",
    "english_word": "milk",
    "french_word_example": "Il boit du lait tous les matins.",
    "english_word_example": "He drinks milk every morning."
  },
  {
    "french_word": "boire",
    "english_word": "drink",
    "french_word_example": "Que voulez-vous boire ?",
    "english_word_example": "What would you like to drink?"
  },
  {
    "french_word": "manger",
    "english_word": "eat",
    "french_word_example": "Qu'est-ce que vous voulez manger ?",
    "english_word_example": "What do you want to eat?"
  },
  {
    "french_word": "café",
    "english_word": "coffee",
    "french_word_example": "Je prends un café le matin.",
    "english_word_example": "I have coffee in the morning."
  },
  {
    "french_word": "thé",
    "english_word": "tea",
    "french_word_example": "Elle préfère le thé au café.",
    "english_word_example": "She prefers tea to coffee."
  },
  {
    "french_word": "maison",
    "english_word": "house",
    "french_word_example": "Ma maison est près de la plage.",
    "english_word_example": "My house is near the beach."
  },
  {
    "french_word": "école",
    "english_word": "school",
    "french_word_example": "Les enfants vont à l'école.",
    "english_word_example": "Children go to school."
  },
  {
    "french_word": "travail",
    "english_word": "work",
    "french_word_example": "Je vais au travail en vélo.",
    "english_word_example": "I go to work by bike."
  },
  {
    "french_word": "famille",
    "english_word": "family",
    "french_word_example": "Ma famille est très importante pour moi.",
    "english_word_example": "My family is very important to me."
  },
  {
    "french_word": "ami",
    "english_word": "friend",
    "french_word_example": "Mon ami vient me voir ce soir.",
    "english_word_example": "My friend is coming to see me tonight."
  },
  {
    "french_word": "amie",
    "english_word": "friend (female)",
    "french_word_example": "Mon amie habite à Paris.",
    "english_word_example": "My friend lives in Paris."
  },
  {
    "french_word": "temps",
    "english_word": "time/weather",
    "french_word_example": "Il fait beau temps aujourd'hui.",
    "english_word_example": "The weather is nice today."
  },
  {
    "french_word": "aujourd'hui",
    "english_word": "today",
    "french_word_example": "Aujourd'hui, je vais au cinéma.",
    "english_word_example": "Today, I'm going to the cinema."
  },
  {
    "french_word": "demain",
    "english_word": "tomorrow",
    "french_word_example": "Demain, nous partons en vacances.",
    "english_word_example": "Tomorrow, we're going on vacation."
  },
  {
    "french_word": "hier",
    "english_word": "yesterday",
    "french_word_example": "Hier, j'ai rencontré un vieil ami.",
    "english_word_example": "Yesterday, I met an old friend."
  },
  {
    "french_word": "maintenant",
    "english_word": "now",
    "french_word_example": "Je dois partir maintenant.",
    "english_word_example": "I have to leave now."
  },
  {
    "french_word": "puis",
    "english_word": "then",
    "french_word_example": "D'abord nous mangeons, puis nous partons.",
    "english_word_example": "First we eat, then we leave."
  },
  {
    "french_word": "toujours",
    "english_word": "always",
    "french_word_example": "Il est toujours en retard.",
    "english_word_example": "He is always late."
  },
  {
    "french_word": "jamais",
    "english_word": "never",
    "french_word_example": "Je ne mange jamais de viande.",
    "english_word_example": "I never eat meat."
  },
  {
    "french_word": "plus",
    "english_word": "never",
    "french_word_example": "Je ne mange jamais de viande.",
    "english_word_example": "I never eat meat."
  }
];

exports.handler = async function (event, context) {
  console.log('Function called with:', event.queryStringParameters);
  console.log('Dictionary loaded with', dictionary.length, 'entries');
  
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
        dictionary_size: dictionary.length,
        sample_words: dictionary.slice(0, 5).map(entry => entry.french_word)
      }),
    };
  }
};
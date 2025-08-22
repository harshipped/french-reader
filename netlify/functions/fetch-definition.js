// netlify/functions/fetch-definition.js
// Enhanced version with phrase translation and improved word definitions

// In-memory cache (persists for the lifetime of the serverless function instance)
const translationCache = new Map();
const definitionCache = new Map();

// Cache TTL: 10 minutes
const CACHE_TTL = 10 * 60 * 1000; // ms

const https = require('https');
const http = require('http');

// Expanded fallback dictionary for common French words
const fallbackDictionary = [
  {
    "french_word": "puis",
    "english_word": "then",
    "part_of_speech": "adverb",
    "french_word_example": "D'abord nous mangeons, puis nous partons.",
    "english_word_example": "First we eat, then we leave.",
    "phonetic": "/pɥi/"
  },
  {
    "french_word": "dans",
    "english_word": "in",
    "part_of_speech": "preposition",
    "french_word_example": "Les animaux sauvages vivent dans la forêt.",
    "english_word_example": "Wild animals live in the forest.",
    "phonetic": "/dɑ̃/"
  },
  {
    "french_word": "bonjour",
    "english_word": "hello/good morning",
    "part_of_speech": "interjection",
    "french_word_example": "Bonjour, comment allez-vous ?",
    "english_word_example": "Hello, how are you?",
    "phonetic": "/bonˈʒuʁ/"
  },
  {
    "french_word": "merci",
    "english_word": "thank you",
    "part_of_speech": "interjection",
    "french_word_example": "Merci beaucoup pour votre aide.",
    "english_word_example": "Thank you very much for your help.",
    "phonetic": "/mɛʁˈsi/"
  },
  {
    "french_word": "vous",
    "english_word": "you",
    "part_of_speech": "pronoun",
    "french_word_example": "Comment vous appelez-vous ?",
    "english_word_example": "What is your name?",
    "phonetic": "/vu/"
  },
  {
    "french_word": "avec",
    "english_word": "with",
    "part_of_speech": "preposition",
    "french_word_example": "Je vais avec mes amis.",
    "english_word_example": "I'm going with my friends.",
    "phonetic": "/aˈvɛk/"
  },
  {
    "french_word": "être",
    "english_word": "to be",
    "part_of_speech": "verb",
    "french_word_example": "Je suis content d'être ici.",
    "english_word_example": "I'm happy to be here.",
    "phonetic": "/ɛtʁ/"
  },
  {
    "french_word": "avoir",
    "english_word": "to have",
    "part_of_speech": "verb",
    "french_word_example": "J'ai faim.",
    "english_word_example": "I am hungry.",
    "phonetic": "/aˈvwaʁ/"
  },
  {
    "french_word": "faire",
    "english_word": "to do/make",
    "part_of_speech": "verb",
    "french_word_example": "Que faites-vous ?",
    "english_word_example": "What are you doing?",
    "phonetic": "/fɛʁ/"
  },
  {
    "french_word": "aller",
    "english_word": "to go",
    "part_of_speech": "verb",
    "french_word_example": "Je vais au marché.",
    "english_word_example": "I'm going to the market.",
    "phonetic": "/aˈle/"
  }
];

// Helper function to make HTTP/HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;

    const req = protocol.request(url, { ...options, method: options.method || 'GET' }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // Handle non-200 status
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 100)}`));
        }

        // Detect HTML (anti-bot response)
        if (data.trim().startsWith('<!DOCTYPE') || data.includes('<html') || data.includes('grecaptcha')) {
          return reject(new Error('Blocked by service (HTML response)'));
        }

        // Try to parse JSON
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          reject(new Error('Invalid JSON response from translation service'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    // ⏱ Reduce timeout to 5s (was 5000ms)
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Translation request timed out'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Determine if input is a single word or phrase
function isPhrase(text) {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length > 1;
}

// Count words in text
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Clean and validate text input
function cleanText(text) {
  return text
    .trim()
    .replace(/\s+/g, ' ') // normalize whitespace
    .replace(/^[.,!?;:"'()[\]{}—–-]+|[.,!?;:"'()[\]{}—–-]+$/g, '') // remove leading/trailing punctuation
    .trim();
}

// Get word definition from various APIs
async function getWordDefinitionFromAPI(word) {
  try {
    // Try multiple French dictionary APIs in sequence
    const apis = [
      // Free Dictionary API (supports French)
      {
        name: 'dictionary',
        url: `https://api.dictionaryapi.dev/api/v2/entries/fr/${encodeURIComponent(word)}`
      },
      // Alternative: Use Google Translate for basic definition
      {
        name: 'translate',
        url: `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=en&dt=t&q=${encodeURIComponent(word)}`
      }
    ];

    for (const api of apis) {
      try {
        console.log(`Trying ${api.name} API for word: ${word}`);
        const result = await makeRequest(api.url);
        
        if (api.name === 'dictionary' && result && Array.isArray(result) && result[0]) {
          const entry = result[0];
          const meanings = entry.meanings || [];
          
          return {
            word: entry.word || word,
            phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
            audio: entry.phonetics?.find(p => p.audio)?.audio || null,
            definitions: meanings.map(meaning => ({
              partOfSpeech: meaning.partOfSpeech || 'unknown',
              definition: meaning.definitions?.[0]?.definition || 'Definition available',
              example: meaning.definitions?.[0]?.example || null
            })),
            source: 'dictionary'
          };
        }
        
        if (api.name === 'translate' && result && Array.isArray(result) && result[0]?.[0]?.[0]) {
          const translation = result[0][0][0];
          return {
            word: word,
            phonetic: '',
            audio: null,
            definitions: [{
              partOfSpeech: 'unknown',
              definition: translation,
              example: `Exemple: "${word}" dans une phrase.`
            }],
            source: 'translate'
          };
        }
        
      } catch (apiError) {
        console.log(`${api.name} API failed:`, apiError.message);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('All word definition APIs failed:', error);
    return null;
  }
}



// In-memory cache for translations
// const translationCache = new Map();
// const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getPhraseTranslation(phrase) {
  const cleaned = cleanText(phrase).toLowerCase();
  const now = Date.now();

  // Check cache
  if (translationCache.has(cleaned)) {
    const { data, timestamp } = translationCache.get(cleaned);
    if (now - timestamp < CACHE_TTL) {
      console.log('✅ Cache hit:', cleaned);
      return data;
    } else {
      translationCache.delete(cleaned);
    }
  }

  try {
    const response = await makeRequest('https://translate.argosopentech.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: cleaned,
        source: 'fr',
        target: 'en'
      })
    });

    if (response && response.translatedText) {
      // Build breakdown
      const words = cleaned.split(/\s+/);
      const breakdown = await Promise.all(
        words.map(async (word) => {
          const cleanWord = cleanText(word);
          if (!cleanWord) return { word: '', meaning: '' };
          try {
            const wordRes = await makeRequest('https://translate.argosopentech.com/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ q: cleanWord, source: 'fr', target: 'en' })
            });
            return {
              word: cleanWord,
              meaning: wordRes.translatedText || cleanWord
            };
          } catch {
            return { word: cleanWord, meaning: '(unavailable)' };
          }
        })
      );

      const result = {
        phrase: cleaned,
        translation: response.translatedText,
        context: determineContext(cleaned, response.translatedText),
        breakdown,
        source: 'libretranslate'
      };

      translationCache.set(cleaned, { data: result, timestamp: now });
      return result;
    }
  } catch (error) {
    console.error('Phrase translation failed:', error.message);
    // ✅ Always return fallback
    return getFallbackPhraseTranslation(cleaned);
  }

  // ✅ Fallback if no response
  return getFallbackPhraseTranslation(cleaned);
}

function getFallbackPhraseTranslation(phrase) {
  console.log('🔁 Using fallback dictionary for:', phrase);
  const words = phrase.split(/\s+/);
  const breakdown = words
    .map(word => {
      const cleanWord = cleanText(word);
      const entry = fallbackDictionary.find(e => 
        e.french_word.toLowerCase() === cleanWord.toLowerCase()
      );
      return {
        word: cleanWord,
        meaning: entry ? entry.english_word : '(translation unavailable)'
      };
    })
    .filter(item => item.word); // Remove empty

  const translation = breakdown
    .map(b => b.meaning.replace(/\(.*\)/, '').trim())
    .join(' ') || phrase;

  return {
    phrase: phrase,
    translation: translation,
    context: determineContext(phrase, translation),
    breakdown: breakdown,
    source: 'fallback-dictionary'
  };
}

// Determine context for common French phrases
function determineContext(originalPhrase, translation) {
  const phrase = originalPhrase.toLowerCase();
  
  // Common greeting patterns
  if (phrase.includes('bonjour') || phrase.includes('bonsoir') || phrase.includes('salut')) {
    return 'greeting';
  }
  
  // Question patterns
  if (phrase.startsWith('comment') || phrase.startsWith('qu\'est-ce') || phrase.startsWith('où') || 
      phrase.startsWith('quand') || phrase.startsWith('pourquoi') || phrase.includes('?')) {
    return 'question';
  }
  
  // Polite expressions
  if (phrase.includes('merci') || phrase.includes('s\'il vous plaît') || phrase.includes('excusez-moi')) {
    return 'polite expression';
  }
  
  // Time expressions
  if (phrase.includes('aujourd\'hui') || phrase.includes('demain') || phrase.includes('hier') ||
      phrase.includes('maintenant') || phrase.includes('plus tard')) {
    return 'time expression';
  }
  
  // Location expressions
  if (phrase.includes('ici') || phrase.includes('là') || phrase.includes('où') || phrase.includes('dans')) {
    return 'location expression';
  }
  
  // Action/verb phrases
  if (phrase.includes('je veux') || phrase.includes('j\'ai') || phrase.includes('je suis') ||
      phrase.includes('nous allons') || phrase.includes('vous êtes')) {
    return 'action or state';
  }
  
  return 'general expression';
}

// Search fallback dictionary for single words
function searchFallbackDictionary(word) {
  const cleanedWord = word.toLowerCase();
  
  // Exact match first
  let foundEntry = fallbackDictionary.find(entry => 
    entry.french_word.toLowerCase() === cleanedWord
  );

  // Try without final 's' (plural)
  if (!foundEntry && cleanedWord.endsWith('s') && cleanedWord.length > 2) {
    const singularWord = cleanedWord.slice(0, -1);
    foundEntry = fallbackDictionary.find(entry => 
      entry.french_word.toLowerCase() === singularWord
    );
  }

  // Try without final 'e' (feminine)
  if (!foundEntry && cleanedWord.endsWith('e') && cleanedWord.length > 2) {
    const masculineWord = cleanedWord.slice(0, -1);
    foundEntry = fallbackDictionary.find(entry => 
      entry.french_word.toLowerCase() === masculineWord
    );
  }

  return foundEntry;
}

// Main handler function
exports.handler = async function (event, context) {
  console.log('Function called with method:', event.httpMethod);
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  let requestData;
  
  // Handle both GET and POST requests
  if (event.httpMethod === 'GET') {
    // Legacy support for GET requests with query parameter
    const word = event.queryStringParameters?.word;
    if (!word) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Word parameter is missing' })
      };
    }
    requestData = { text: word, isPhrase: false };
  } else if (event.httpMethod === 'POST') {
    // Parse POST body
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
  } else {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { text, isPhrase } = requestData;
  
  if (!text) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Text parameter is missing' })
    };
  }

  const cleanedText = cleanText(text);
  const wordCount = countWords(cleanedText);
  
  console.log(`Processing: "${cleanedText}" (${wordCount} words, isPhrase: ${isPhrase})`);

  // Validate word count
  if (wordCount > 8) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Selection too long. Maximum 8 words allowed.',
        wordCount: wordCount
      })
    };
  }

  let responseData;

  try {
    if (isPhrase || wordCount > 1) {
      // Handle phrase translation
      console.log('Processing as phrase...');
      const translationData = await getPhraseTranslation(cleanedText);
      
      if (translationData) {
        responseData = {
          type: 'translation',
          phrase: translationData.phrase,
          translation: translationData.translation,
          context: translationData.context,
          breakdown: translationData.breakdown,
          source: translationData.source
        };
      } else {
        throw new Error('Failed to translate phrase');
      }
      
    } else {
      // Handle single word definition
      console.log('Processing as single word...');
      let wordData = await getWordDefinitionFromAPI(cleanedText);
      
      // Fallback to local dictionary if API fails
      if (!wordData) {
        const fallbackEntry = searchFallbackDictionary(cleanedText);
        if (fallbackEntry) {
          wordData = {
            word: fallbackEntry.french_word,
            phonetic: fallbackEntry.phonetic || '',
            audio: null,
            definitions: [{
              partOfSpeech: fallbackEntry.part_of_speech || 'unknown',
              definition: fallbackEntry.english_word,
              example: fallbackEntry.french_word_example
            }],
            source: 'fallback'
          };
        }
      }

      if (wordData) {
        responseData = {
          type: 'definition',
          word: wordData.word,
          phonetic: wordData.phonetic,
          audio: wordData.audio,
          definitions: wordData.definitions,
          source: wordData.source
        };
      } else {
        throw new Error(`No definition found for "${cleanedText}"`);
      }
    }

    console.log(`Successfully processed "${cleanedText}" as ${responseData.type}`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Processing failed:', error.message);
    
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message,
        searched_for: cleanedText,
        word_count: wordCount,
        suggestion: wordCount > 1 ? 
          'Try selecting fewer words or check spelling' : 
          'Try checking the spelling or try a different word form'
      })
    };
  }
};
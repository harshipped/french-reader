// Netlify Function: Microsoft Translator Proxy
import fetch from "node-fetch";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const { text, from = "fr", to = "en" } = body;

    const response = await fetch(
      `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${from}&to=${to}`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.AZURE_TRANSLATOR_KEY,
          "Ocp-Apim-Subscription-Region": process.env.AZURE_TRANSLATOR_REGION,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([{ Text: text }])
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error("Azure translation failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Translation failed" })
    };
  }
}

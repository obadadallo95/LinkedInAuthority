import { GoogleGenAI, Schema } from "@google/genai";

let ai: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!ai) {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      ai = new GoogleGenAI({ 
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return ai;
}

export async function callGeminiWithRetry(client: GoogleGenAI, prompt: string, systemInstruction: string, schema: Schema) {
  let response;
  let retries = 2;
  while (retries >= 0) {
    try {
      response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });
      break; 
    } catch (e: any) {
      const errStr = String(e.message || e).toLowerCase();
      const isBusy = errStr.includes('503') || errStr.includes('high demand') || errStr.includes('unavailable');
      if (retries === 0 || !isBusy) {
        throw e;
      }
      console.warn(`Gemini is busy (503). Retrying in 3 seconds... (${retries} left)`);
      const delay = Math.min(10000, 1000 * Math.pow(2, 2 - retries)) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      retries--;
    }
  }

  if (!response || !response.text) {
    throw new Error("No text response from Gemini");
  }
  return JSON.parse(response.text);
}

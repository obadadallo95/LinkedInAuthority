import { GoogleGenAI, Schema } from "@google/genai";

let freeAi: GoogleGenAI | null = null;
let proAi: GoogleGenAI | null = null;

export function getGeminiClient(tier: 'free' | 'pro' = 'free'): GoogleGenAI | null {
  if (tier === 'pro') {
    if (!proAi) {
      // Use GEMINI_PRO_API_KEY if available, fallback to GEMINI_API_KEY
      const proKey = process.env.GEMINI_PRO_API_KEY || process.env.GEMINI_API_KEY;
      if (proKey) {
        if (!process.env.GEMINI_PRO_API_KEY) {
          console.warn("GEMINI_PRO_API_KEY is not set. Falling back to GEMINI_API_KEY for pro tier.");
        }
        proAi = new GoogleGenAI({ 
          apiKey: proKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      }
    }
    return proAi;
  } else {
    if (!freeAi) {
      const freeKey = process.env.GEMINI_API_KEY;
      if (freeKey) {
        freeAi = new GoogleGenAI({ 
          apiKey: freeKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      }
    }
    return freeAi;
  }
}

export async function callGeminiWithRetry(client: GoogleGenAI, prompt: string, systemInstruction: string, schema: Schema, model: string = "gemini-2.5-flash") {
  let response;
  let retries = 2;
  while (retries >= 0) {
    try {
      response = await client.models.generateContent({
        model: model,
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

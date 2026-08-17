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

export async function callGeminiWithRetry(client: GoogleGenAI, prompt: string, systemInstruction: string, schema: Schema, model: string = "gemini-3.6-flash") {
  let response;
  let retries = 2;
  let currentModel = model;
  while (retries >= 0) {
    try {
      response = await client.models.generateContent({
        model: currentModel,
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
      // If a model is not found / deprecated (404), fallback to gemini-3.6-flash or gemini-flash-latest
      if (errStr.includes('not_found') || errStr.includes('404') || errStr.includes('no longer available')) {
        if (currentModel !== 'gemini-3.6-flash') {
          console.warn(`Model ${currentModel} returned 404/not available. Falling back to gemini-3.6-flash.`);
          currentModel = 'gemini-3.6-flash';
          retries--;
          continue;
        } else if (currentModel === 'gemini-3.6-flash') {
          console.warn(`Model gemini-3.6-flash returned 404. Falling back to gemini-flash-latest.`);
          currentModel = 'gemini-flash-latest';
          retries--;
          continue;
        }
      }
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

export function handleGeminiError(error: any, lang: string = 'en'): string {
  let errStr = '';
  if (error && typeof error.message === 'string') {
    errStr = error.message;
  } else if (error && typeof error.message === 'object') {
    errStr = JSON.stringify(error.message);
  } else {
    errStr = String(error);
  }
  
  if (errStr.includes('503') || errStr.includes('high demand') || errStr.includes('unavailable')) {
    return "The AI model is currently experiencing high demand. Please wait a moment and try again.";
  }
  if (errStr.includes('429') || errStr.includes('Quota exceeded') || errStr.includes('RESOURCE_EXHAUSTED')) {
    return lang === 'ar' 
      ? "تم تجاوز الحد المسموح للاستخدام للذكاء الاصطناعي حالياً. يرجى المحاولة مرة أخرى بعد قليل." 
      : "AI model quota exceeded. Please try again in a moment.";
  }
  if (errStr.includes('Custom angle contradicts') || errStr.includes('Generated post contains a blocking claim')) {
    return errStr; // pass through business logic errors
  }
  
  if (errStr.length > 200 || errStr.includes('{')) {
    return "An unexpected error occurred while communicating with the AI service.";
  }
  
  return errStr || "Unknown error";
}

import { GoogleGenAI, Schema, ThinkingLevel as GeminiThinkingLevel } from "@google/genai";
import { 
  AiTask, 
  AI_TASK_ROUTING, 
  ThinkingLevel, 
  TelemetryContext, 
  AiUsageTelemetry,
  calculateEstimatedCostUsd, 
  recordAiUsageTelemetry 
} from "./modelRouting";

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

export interface CallGeminiOptions {
  task?: AiTask;
  telemetryContext?: TelemetryContext;
  model?: string;
  thinkingLevel?: ThinkingLevel;
}

export async function callGeminiWithRetry(
  client: GoogleGenAI, 
  prompt: string, 
  systemInstruction: string, 
  schema: Schema, 
  taskOrOptionsOrModel: AiTask | CallGeminiOptions | string = "repo_analysis"
) {
  let task: AiTask | undefined;
  let telemetryContext: TelemetryContext | undefined;
  let requestedModel: string;
  let fallbackModel: string;
  let thinkingLevel: ThinkingLevel | undefined;
  let maxOutputTokens = 2048;

  if (typeof taskOrOptionsOrModel === 'string') {
    if (taskOrOptionsOrModel in AI_TASK_ROUTING) {
      task = taskOrOptionsOrModel as AiTask;
      const routing = AI_TASK_ROUTING[task];
      requestedModel = routing.primaryModel;
      fallbackModel = routing.fallbackModel;
      thinkingLevel = routing.thinkingLevel;
      maxOutputTokens = routing.maxOutputTokens;
    } else {
      // Direct model string passed (legacy compatibility)
      requestedModel = taskOrOptionsOrModel;
      fallbackModel = 'gemini-3.6-flash';
    }
  } else {
    task = taskOrOptionsOrModel.task;
    telemetryContext = taskOrOptionsOrModel.telemetryContext;
    if (task && task in AI_TASK_ROUTING) {
      const routing = AI_TASK_ROUTING[task];
      requestedModel = taskOrOptionsOrModel.model || routing.primaryModel;
      fallbackModel = routing.fallbackModel;
      thinkingLevel = taskOrOptionsOrModel.thinkingLevel || routing.thinkingLevel;
      maxOutputTokens = routing.maxOutputTokens;
    } else {
      requestedModel = taskOrOptionsOrModel.model || "gemini-3.7-flash";
      fallbackModel = 'gemini-3.6-flash';
      thinkingLevel = taskOrOptionsOrModel.thinkingLevel;
    }
  }

  let response;
  let retries = 2;
  let currentModel = requestedModel;
  let retryCount = 0;
  const startTime = Date.now();

  while (retries >= 0) {
    try {
      const config: any = {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        maxOutputTokens,
      };

      // Gemini 3.x uses thinkingLevel. Keep the same bounded policy when a
      // stable fallback (for example 3.6) is selected, instead of silently
      // reverting to the provider's default thinking level and cost.
      if (thinkingLevel && currentModel.startsWith('gemini-3.')) {
        config.thinkingConfig = {
          thinkingLevel: GeminiThinkingLevel[thinkingLevel],
        };
      }

      response = await client.models.generateContent({
        model: currentModel,
        contents: prompt,
        config
      });
      break; 
    } catch (e: any) {
      const errStr = String(e.message || e).toLowerCase();
      // If model is not found / deprecated (404), fallback to safe fallback model
      if (errStr.includes('not_found') || errStr.includes('404') || errStr.includes('no longer available')) {
        if (currentModel !== fallbackModel) {
          console.warn(`[Model Fallback] Model ${currentModel} returned 404/unavailable. Falling back to ${fallbackModel}.`);
          currentModel = fallbackModel;
          retries--;
          retryCount++;
          continue;
        } else if (currentModel === fallbackModel && fallbackModel !== 'gemini-flash-latest') {
          console.warn(`[Model Fallback] Fallback model ${currentModel} returned 404. Falling back to gemini-flash-latest.`);
          currentModel = 'gemini-flash-latest';
          retries--;
          retryCount++;
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
      retryCount++;
    }
  }

  if (!response || !response.text) {
    throw new Error("No text response from Gemini");
  }

  const durationMs = Date.now() - startTime;

  // Capture Usage Telemetry
  if (task) {
    const usage = response.usageMetadata || {};
    const promptTokens = usage.promptTokenCount || 0;
    const candidateTokens = usage.candidatesTokenCount || 0;
    const thoughtTokens = usage.thoughtsTokenCount || 0;
    const totalTokens = usage.totalTokenCount || (promptTokens + candidateTokens + thoughtTokens);
    const estimatedCostUsd = calculateEstimatedCostUsd(currentModel, promptTokens, candidateTokens, thoughtTokens);

    const telemetry: AiUsageTelemetry = {
      task,
      requestedModel,
      actualModel: currentModel,
      thinkingLevel,
      promptTokens,
      candidateTokens,
      thoughtTokens,
      totalTokens,
      estimatedCostUsd,
      durationMs,
      retryCount,
      feature: telemetryContext?.feature,
      isDemo: telemetryContext?.isDemo,
      isAutomated: telemetryContext?.isAutomated,
      repository: telemetryContext?.repository,
      timestamp: new Date().toISOString()
    };

    // Non-blocking telemetry recording
    recordAiUsageTelemetry(telemetryContext, telemetry).catch(err => {
      console.warn('[Telemetry Error]:', err.message);
    });
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
  if (errStr.toLowerCase().includes('token') || errStr.toLowerCase().includes('signature') || errStr.toLowerCase().includes('missing analysis')) {
    return "Invalid or expired analysis token. Please analyze again.";
  }
  
  // Never expose vendor/network error text to a browser: it may contain
  // request metadata, internal paths, or provider-specific details.
  return "An unexpected error occurred while communicating with the AI service.";
}

import { getGeminiClient, callGeminiWithRetry } from './gemini';
import { getGenerateSystemPrompt, getGenerateLanguageInstruction } from './prompts';
import { generateSchema } from './schemas';
import { getAngleFromCache } from './cache';

export async function generatePostFromAngle(
  repoUrl: string, 
  ghContext: any, 
  projectDescription: string, 
  angleId: string, 
  humanContext: string, 
  lang: string
) {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini API client is not configured.");
  }

  // Zero-Trust verification: retrieve the angle from cache instead of trusting the client
  const cachedAngle = getAngleFromCache(repoUrl, angleId);
  if (!cachedAngle) {
    throw new Error("Angle not found or expired. Please re-analyze the repository.");
  }

  if (cachedAngle.requiresHumanContext && !humanContext) {
    throw new Error("This angle requires human context, but none was provided.");
  }

  const systemPrompt = getGenerateSystemPrompt();
  const languageInstruction = getGenerateLanguageInstruction(lang);

  const prompt = `
    Repository: ${ghContext.repoData.name}
    Description: ${ghContext.repoData.description || "None"}
    Languages: ${Object.keys(ghContext.languages).join(", ")}
    
    User Project Description (Context): ${projectDescription || "None."}
    
    Manifest Snippets:
    ${ghContext.manifestData || "None found."}

    README Snippet:
    ${ghContext.readmeText || "None found."}
    
    Chosen Angle (Server Verified):
    - Title: ${cachedAngle.title}
    - Summary: ${cachedAngle.angleSummary}
    - Intent: ${cachedAngle.intent}
    - Tone: ${cachedAngle.tone}
    - Audience: ${cachedAngle.audience}
    - Audience Value: ${cachedAngle.audienceValue}

    Specific Human Context (Answer to an adaptive question): ${humanContext || "Not provided."}
    
    ${languageInstruction}
    
    Requirements:
    1. Write the post following the Chosen Angle.
    2. Adhere strictly to the requested Tone.
    3. If Human Context is provided, incorporate it naturally.
    4. Do not just summarize the repo; make it sound like a real developer sharing their work.
    5. Extract VERBATIM facts used to build the post. Provide a unique ID for each evidence item (e.g. "ev-1").
  `;

  const result = await callGeminiWithRetry(client, prompt, systemPrompt, generateSchema);
  
  // Check conflicts (simulated simple conflict detection for the UI demo)
  const conflicts = [] as any[]; 

  return {
    post: result.post,
    evidence: result.evidence,
    conflicts
  };
}

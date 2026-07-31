import { getGeminiClient, callGeminiWithRetry } from './gemini';
import { getAnalyzeSystemPrompt } from './prompts';
import { analyzeSchema } from './schemas';
import { CandidateAngle, Evidence, ClaimConflict } from './types';

export async function analyzeRepositoryAngles(
  repoUrl: string, 
  ghContext: any, 
  projectDescription: string, 
  intent: string, 
  lang: string
): Promise<{ repository: any, angles: CandidateAngle[], atomicFacts: Evidence[], conflicts: ClaimConflict[] }> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini API client is not configured.");
  }

  const systemPrompt = getAnalyzeSystemPrompt(lang, intent);

  const prompt = `
    Repository: ${ghContext.repoData.name} by ${ghContext.repoData.owner.login}
    Description: ${ghContext.repoData.description || "No description provided."}
    Topics: ${(ghContext.repoData.topics || []).join(", ")}
    Languages: ${Object.keys(ghContext.languages).join(", ")}
    Stars: ${ghContext.repoData.stargazers_count}
    
    User Project Description (if any): ${projectDescription || "None."}
    
    Manifest Snippets:
    ${ghContext.manifestData || "None found."}

    README Snippet:
    ${ghContext.readmeText || "None found."}
    
    Perform your reasoning steps:
    1. Extract atomicFacts.
    2. Group into storyClusters.
    3. Generate internalHypotheses and score them.
    4. Identify conflicts (ClaimConflict).
    5. Output the finalAngles.
  `;

  const result = await callGeminiWithRetry(client, prompt, systemPrompt, analyzeSchema);
  
  return {
    repository: {
      name: ghContext.repoData.name,
      owner: ghContext.repoData.owner.login,
      description: ghContext.repoData.description,
      stars: ghContext.repoData.stargazers_count
    },
    angles: result.finalAngles || [],
    atomicFacts: result.atomicFacts || [],
    conflicts: result.conflicts || []
  };
}

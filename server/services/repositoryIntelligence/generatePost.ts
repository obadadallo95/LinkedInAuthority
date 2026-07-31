import { getGeminiClient, callGeminiWithRetry } from './gemini';
import { getGenerateSystemPrompt, getGenerateLanguageInstruction } from './prompts';
import { generateSchema } from './schemas';
import { AnalysisTokenPayload, CandidateAngle, GenerateResponse } from './types';

export async function generatePostFromAngle(
  tokenPayload: AnalysisTokenPayload, 
  ghContext: any, 
  projectDescription: string, 
  angleId: string | undefined, 
  customAngle: string | undefined,
  humanContext: string, 
  lang: string
): Promise<GenerateResponse> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini API client is not configured.");
  }

  let chosenAngle: Partial<CandidateAngle> | undefined;

  if (customAngle) {
    if (customAngle.length > 200) {
      throw new Error("Custom angle too long. Maximum 200 characters.");
    }
    chosenAngle = {
      title: "Custom Angle",
      angleSummary: customAngle,
      intentMatch: "custom",
      tone: "confident",
      claimRisk: "low",
      audienceValue: "Sharing user-specified context.",
      requiresHumanContext: false
    };
  } else if (angleId) {
    chosenAngle = tokenPayload.angles.find(a => a.id === angleId);
    if (!chosenAngle) {
      throw new Error("Angle not found in analysis token.");
    }
  } else {
    throw new Error("Either angleId or customAngle must be provided.");
  }

  if (chosenAngle.requiresHumanContext && !humanContext) {
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
    
    Verified Atomic Facts from Analysis:
    ${tokenPayload.atomicFacts.map(f => `- [${f.id}] ${f.fact}`).join("\n")}
    
    Identified Conflicts & Warnings:
    ${tokenPayload.conflicts.map(c => `- Claim: ${c.claim} (Severity: ${c.severity}) | Safe Alternative: ${c.safeAlternative}`).join("\n")}
    
    Chosen Angle:
    - Title: ${chosenAngle.title}
    - Summary: ${chosenAngle.angleSummary}
    - Tone: ${chosenAngle.tone || "confident"}
    - Claim Risk: ${chosenAngle.claimRisk || "low"}
    - Audience Value: ${chosenAngle.audienceValue}

    Specific Human Context (User Input): ${humanContext || "Not provided."}
    
    ${languageInstruction}
    
    Requirements:
    1. Write the post following the Chosen Angle.
    2. Adhere strictly to the requested Tone.
    3. Incorporate the provided Human Context naturally if present.
    4. MUST rely heavily on the "Verified Atomic Facts".
    5. DO NOT use any claims marked as "blocking" severity. Use the safe alternative instead.
    6. Return the "usedEvidenceIds" array containing the IDs of facts you used.
    7. Return any warnings if the user's human context or custom angle contradicted facts.
  `;

  const result = await callGeminiWithRetry(client, prompt, systemPrompt, generateSchema);
  
  // Strict Server-side Validation of used Evidence IDs
  const validIds = new Set(tokenPayload.atomicFacts.map(f => f.id));
  const usedEvidenceIds = (result.usedEvidenceIds || []).filter((id: string) => validIds.has(id));

  // Identify if any blocking conflicts were ignored (Simplified check: if post contains exact blocked phrase)
  const blockingConflicts = tokenPayload.conflicts.filter(c => c.severity === "blocking");
  const warnings = result.warnings || [];
  
  for (const conflict of blockingConflicts) {
    if (result.post.toLowerCase().includes(conflict.claim.toLowerCase())) {
      warnings.push(`Warning: The generated post may contain a blocked claim: "${conflict.claim}"`);
    }
  }

  return {
    post: result.post,
    usedEvidenceIds,
    warnings
  };
}

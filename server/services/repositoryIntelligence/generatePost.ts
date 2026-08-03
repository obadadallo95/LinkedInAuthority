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
  lang: string,
  tier: 'free' | 'pro' = 'free'
): Promise<GenerateResponse> {
  const client = getGeminiClient(tier);
  if (!client) {
    throw new Error("Gemini API client is not configured.");
  }

  let chosenAngle: Partial<CandidateAngle> | undefined;

  if (customAngle) {
    if (customAngle.length > 200) {
      throw new Error("Custom angle too long. Maximum 200 characters.");
    }
    const blockingConflicts = tokenPayload.conflicts.filter(c => c.severity === "blocking");
    for (const conflict of blockingConflicts) {
      if (customAngle.toLowerCase().includes(conflict.claim.toLowerCase())) {
        throw new Error(`Custom angle contradicts repository facts: ${conflict.claim}`);
      }
    }

    chosenAngle = {
      id: "custom",
      title: "Custom Angle",
      angleSummary: customAngle,
      intent: "custom",
      tone: "confident",
      claimRisk: "high",
      audience: "professional_network",
      audienceValue: "Sharing user-specified context.",
      requiresHumanContext: false,
      evidenceIds: [],
      supportLevel: "human_context_required",
      recommended: false
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

  const systemPrompt = getGenerateSystemPrompt(chosenAngle.intent || 'auto');
  const languageInstruction = getGenerateLanguageInstruction(lang);

  const prompt = `
    Repository: ${ghContext.repoData.name}
    URL: ${ghContext.repoData.html_url || "None"}
    Homepage: ${ghContext.repoData.homepage || "None"}
    Description: ${ghContext.repoData.description || "None"}
    Languages: ${Object.keys(ghContext.languages).join(", ")}
    
    User Project Description (Context): ${projectDescription || "None."}
    
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

  const model = tier === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const result = await callGeminiWithRetry(client, prompt, systemPrompt, generateSchema, model);
  
  // Strict Server-side Validation of used Evidence IDs
  const validIds = new Set(tokenPayload.atomicFacts.map(f => f.id));
  const rawEvidenceIds = result.usedEvidenceIds || [];
  const usedEvidenceIds = rawEvidenceIds.filter((id: string) => validIds.has(id));
  
  const warnings = result.warnings || [];
  
  if (rawEvidenceIds.length > 0 && usedEvidenceIds.length === 0) {
    warnings.push("Warning: The AI attempted to use unverified or hallucinated evidence facts.");
  }

  // Identify if any blocking conflicts were ignored
  const blockingConflicts = tokenPayload.conflicts.filter(c => c.severity === "blocking");
  for (const conflict of blockingConflicts) {
    if (result.post.toLowerCase().includes(conflict.claim.toLowerCase())) {
      throw new Error(`Generated post contains a blocking claim that contradicts facts: "${conflict.claim}"`);
    }
  }

  const evidence = tokenPayload.atomicFacts.filter(f => usedEvidenceIds.includes(f.id));

  return {
    post: result.post,
    suggestedComment: result.suggestedComment,
    evidence,
    usedEvidenceIds,
    warnings
  };
}

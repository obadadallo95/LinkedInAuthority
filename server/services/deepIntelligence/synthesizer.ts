import { getGeminiClient, callGeminiWithRetry } from '../repositoryIntelligence/gemini';
import { DeepGithubContext } from './githubDeepFetcher';

export interface SynthesizedContext {
  technicalDecisions: string[];
  challengesSolved: string[];
  newFeatures: string[];
  summary: string;
}

const synthesizerSchema = {
  type: "OBJECT",
  properties: {
    technicalDecisions: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Key technical decisions made in the codebase based on commits and PRs."
    },
    challengesSolved: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Problems or bugs that were fixed, extracted from PRs or commit messages."
    },
    newFeatures: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "New features added to the repository recently."
    },
    summary: {
      type: "STRING",
      description: "A comprehensive summary of the recent work done on this repository."
    }
  },
  required: ["technicalDecisions", "challengesSolved", "newFeatures", "summary"]
};

export async function synthesizeDeepContext(deepContext: DeepGithubContext): Promise<SynthesizedContext> {
  const client = getGeminiClient('pro');
  if (!client) {
    throw new Error("Gemini API client is not configured.");
  }

  const prompt = `You are a Senior Software Architecture Analyzer.
Analyze the following recent commits and merged Pull Requests from the repository ${deepContext.owner}/${deepContext.repo}.

COMMITS:
${JSON.stringify(deepContext.commits.slice(0, 15), null, 2)}

PULL REQUESTS:
${JSON.stringify(deepContext.pullRequests.slice(0, 10), null, 2)}

Your task is to synthesize this raw data into:
1. Technical Decisions: What underlying architectural or technical choices were made?
2. Challenges Solved: What were the bugs or hard problems that got fixed?
3. New Features: What new capabilities were added?
4. Summary: A brief paragraph describing the recent momentum of the project.

Do not invent information. If the commits are vague (e.g., "fix typo", "update readme"), state that there were no major architectural decisions rather than making them up.`;

  const model = "gemini-2.5-flash"; // Flash is fast and cheap for this intermediate step

  try {
    const systemInstruction = "You are a Senior Software Architecture Analyzer.";
    const response = await callGeminiWithRetry(client, prompt, systemInstruction, synthesizerSchema as any, model);
    return response as SynthesizedContext;
  } catch (error: any) {
    console.error("Error synthesizing deep context:", error);
    throw new Error("Failed to synthesize deep context: " + error.message);
  }
}

import { getGeminiClient, callGeminiWithRetry } from '../repositoryIntelligence/gemini';
import { GroundedDeepGithubContext } from './githubDeepFetcher';

export interface SynthesizedContext {
  hasMeaningfulContent: boolean;
  technicalDecisions: string[];
  challengesSolved: string[];
  newFeatures: string[];
  summary: string;
}

const synthesizerSchema = {
  type: "OBJECT",
  properties: {
    hasMeaningfulContent: {
      type: "BOOLEAN",
      description: "True if the monitored commits/PRs/issues contain real, meaningful engineering changes worth discussing in a post. False if changes are trivial, empty, or purely noise (e.g. typos, formatting only)."
    },
    technicalDecisions: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Key technical decisions made in the codebase based on recent activity, strictly grounded in the repository domain."
    },
    challengesSolved: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Problems, bugs, or performance issues resolved in the recent activity."
    },
    newFeatures: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "New features or improvements added to the repository."
    },
    summary: {
      type: "STRING",
      description: "A grounded summary of recent development momentum."
    }
  },
  required: ["hasMeaningfulContent", "technicalDecisions", "challengesSolved", "newFeatures", "summary"]
};

export async function synthesizeDeepContext(deepContext: GroundedDeepGithubContext): Promise<SynthesizedContext> {
  const client = getGeminiClient('pro');
  if (!client) {
    throw new Error("Gemini API client is not configured.");
  }

  const identity = deepContext.repoIdentity || {
    name: deepContext.repo,
    description: '',
    readmeText: '',
    manifestData: '',
    languages: {},
    topics: []
  };

  const prompt = `You are a Senior Software Architecture and Engineering Analyzer.
Analyze the following recent activity for repository ${deepContext.owner}/${deepContext.repo}.

STABLE REPOSITORY IDENTITY (GROUND TRUTH):
- Name: ${identity.name}
- Description: ${identity.description || "None provided"}
- Topics: ${(identity.topics || []).join(", ") || "None"}
- Primary Languages: ${Object.keys(identity.languages || {}).join(", ") || "Unknown"}
- README Excerpt:
${identity.readmeText ? identity.readmeText.substring(0, 4000) : "No README available"}
- Manifest Snippet:
${identity.manifestData ? identity.manifestData.substring(0, 2000) : "No manifest available"}

MONITORED RECENT ACTIVITY:
COMMITS (${deepContext.commits.length}):
${JSON.stringify(deepContext.commits.slice(0, 15), null, 2)}

MERGED PULL REQUESTS (${deepContext.pullRequests.length}):
${JSON.stringify(deepContext.pullRequests.slice(0, 10), null, 2)}

ISSUES UPDATED (${deepContext.issues?.length || 0}):
${JSON.stringify((deepContext.issues || []).slice(0, 10), null, 2)}

CRITICAL GROUNDING RULES:
1. Ground truth regarding what this product/project actually does comes STRICTLY from the Stable Repository Identity (README and Description).
2. DO NOT invent or infer what the product does from repository names or commit messages (e.g. do not assume a repository named "KeyFixer" is a config validator if the README explains it fixes keyboard/typing layout issues).
3. If the monitored activity contains no meaningful changes or only trivial edits (e.g. bumping version numbers, formatting), set "hasMeaningfulContent": false.
4. Do not invent technical decisions that are not evidenced in the commits, PRs, or issues.`;

  try {
    const systemInstruction = "You are a Senior Software Architecture Analyzer. Strictly ground all analysis in the provided repository identity and observed activity.";
    const response = await callGeminiWithRetry(client, prompt, systemInstruction, synthesizerSchema as any, {
      task: 'deep_synthesis',
      telemetryContext: {
        feature: 'deep_synthesis',
        repository: `${deepContext.owner}/${deepContext.repo}`
      }
    });
    return response as SynthesizedContext;
  } catch (error: any) {
    console.error("Error synthesizing deep context:", error);
    throw new Error("Failed to synthesize deep context: " + error.message);
  }
}

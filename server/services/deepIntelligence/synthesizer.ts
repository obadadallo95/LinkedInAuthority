import { getGeminiClient, callGeminiWithRetry, handleGeminiError } from '../repositoryIntelligence/gemini';
import { GroundedDeepGithubContext, VerifiedLink } from './githubDeepFetcher';
import { UserTier } from '../entitlements';
import { EvidenceItem } from './claimAudit';
import { TelemetryContext } from '../repositoryIntelligence/modelRouting';

export interface ProductProfile {
  name: string;
  oneSentencePurpose?: string;
  problemSolved?: string;
  targetUsers: string[];
  primaryBenefits: string[];
  majorCapabilities: string[];
  platforms: string[];
  privacyCharacteristics: string[];
  distributionChannels: string[];
  releaseStatus?: string;
  homepageUrl?: string;
  repositoryUrl: string;
  verifiedLinks: VerifiedLink[];
}

export interface SynthesizedContext {
  hasMeaningfulContent: boolean;
  productProfile?: ProductProfile;
  technicalDecisions: string[];
  challengesSolved: string[];
  newFeatures: string[];
  summary: string;
  evidence?: EvidenceItem[];
}

function buildEvidencePack(deepContext: GroundedDeepGithubContext): EvidenceItem[] {
  const evidence: EvidenceItem[] = [
    { id: 'repo:metadata', sourceType: 'metadata', reference: `github:repo:${deepContext.owner}/${deepContext.repo}`, excerpt: `${deepContext.repoIdentity.name}. ${deepContext.repoIdentity.description}` },
    { id: 'repo:readme', sourceType: 'readme', reference: `github:readme:${deepContext.owner}/${deepContext.repo}`, excerpt: deepContext.repoIdentity.readmeText.slice(0, 5000) },
    { id: 'repo:manifest', sourceType: 'manifest', reference: `github:manifest:${deepContext.owner}/${deepContext.repo}`, excerpt: deepContext.repoIdentity.manifestData.slice(0, 2500) },
  ];
  for (const [index, commit] of deepContext.commits.slice(0, 15).entries()) {
    evidence.push({ id: `commit:${index}`, sourceType: 'commit', reference: `github:commit:${commit.sha || `${deepContext.owner}/${deepContext.repo}:${commit.date}`}`, excerpt: `${commit.message} ${commit.date}` });
  }
  for (const [index, pr] of deepContext.pullRequests.slice(0, 10).entries()) {
    evidence.push({ id: `pull_request:${index}`, sourceType: 'pull_request', reference: `github:pull_request:${deepContext.owner}/${deepContext.repo}:${pr.merged_at}`, excerpt: `${pr.title} ${pr.body}` });
  }
  for (const [index, issue] of deepContext.issues.slice(0, 10).entries()) {
    evidence.push({ id: `issue:${index}`, sourceType: 'issue', reference: `github:issue:${deepContext.owner}/${deepContext.repo}:${issue.updated_at}`, excerpt: `${issue.title} ${issue.body}` });
  }
  for (const file of deepContext.repositoryMap?.selectedFiles || []) {
    evidence.push({ id: `file:${file.path}`, sourceType: 'file', reference: file.source, excerpt: file.content });
  }
  return evidence;
}

const synthesizerSchema = {
  type: "OBJECT",
  properties: {
    hasMeaningfulContent: {
      type: "BOOLEAN",
      description: "True if the monitored commits/PRs/issues contain real, meaningful engineering changes worth discussing in a post. False if changes are trivial, empty, or purely noise (e.g. typos, formatting only)."
    },
    productProfile: {
      type: "OBJECT",
      description: "Grounded product profile strictly extracted from the README, description, and verified metadata.",
      properties: {
        name: { type: "STRING", description: "The official product or repository name." },
        oneSentencePurpose: { type: "STRING", description: "A crisp, one-sentence description of what the product does for its users." },
        problemSolved: { type: "STRING", description: "The specific everyday frustration, problem, or friction this product eliminates." },
        targetUsers: { type: "ARRAY", items: { type: "STRING" }, description: "Who this product is built for (e.g. Mac users, multi-lingual typists, developers)." },
        primaryBenefits: { type: "ARRAY", items: { type: "STRING" }, description: "Core user benefits (e.g. saves time, zero friction, native feel)." },
        majorCapabilities: { type: "ARRAY", items: { type: "STRING" }, description: "Key verified features or capabilities documented in the README." },
        platforms: { type: "ARRAY", items: { type: "STRING" }, description: "Explicitly documented operating systems or environments (e.g. macOS, Windows, Chrome Extension, Web/PWA)." },
        privacyCharacteristics: { type: "ARRAY", items: { type: "STRING" }, description: "Explicitly documented privacy, security, or offline properties (e.g. 100% offline, no server storage)." },
        distributionChannels: { type: "ARRAY", items: { type: "STRING" }, description: "Explicitly documented stores or distribution avenues (e.g. Mac App Store, Microsoft Store, Chrome Web Store, Web App)." },
        releaseStatus: { type: "STRING", description: "Documented version or launch milestone if stated in the README." }
      },
      required: ["name"]
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

export async function synthesizeDeepContext(
  deepContext: GroundedDeepGithubContext,
  tier: UserTier = 'free',
  telemetryContext?: TelemetryContext,
): Promise<SynthesizedContext> {
  const client = getGeminiClient(tier);
  if (!client) {
    throw new Error("Gemini API client is not configured.");
  }

  const identity = deepContext.repoIdentity || {
    name: deepContext.repo,
    description: '',
    readmeText: '',
    manifestData: '',
    languages: {},
    topics: [],
    homepageUrl: undefined
  };

  const canonicalRepoUrl = `https://github.com/${deepContext.owner}/${deepContext.repo}`;
  const repositoryMap = deepContext.repositoryMap;

  const prompt = `You are a Senior Software Architecture and Product Intelligence Analyzer.
Analyze the following repository identity and recent activity for repository ${deepContext.owner}/${deepContext.repo}.

STABLE REPOSITORY IDENTITY (GROUND TRUTH):
- Name: ${identity.name}
- Description: ${identity.description || "None provided"}
- Topics: ${(identity.topics || []).join(", ") || "None"}
- Primary Languages: ${Object.keys(identity.languages || {}).join(", ") || "Unknown"}
- Homepage: ${identity.homepageUrl || "None"}
- Verified Links: ${JSON.stringify(deepContext.verifiedLinks || [], null, 2)}
- README Excerpt:
${identity.readmeText ? identity.readmeText.substring(0, 5000) : "No README available"}
- Manifest Snippet:
${identity.manifestData ? identity.manifestData.substring(0, 2000) : "No manifest available"}

MONITORED RECENT ACTIVITY:
COMMITS (${deepContext.commits.length}):
${JSON.stringify(deepContext.commits.slice(0, 15), null, 2)}

MERGED PULL REQUESTS (${deepContext.pullRequests.length}):
${JSON.stringify(deepContext.pullRequests.slice(0, 10), null, 2)}

ISSUES UPDATED (${deepContext.issues?.length || 0}):
${JSON.stringify((deepContext.issues || []).slice(0, 10), null, 2)}

REPOSITORY MAP (DETERMINISTIC, NOT MODEL-INFERRED):
${JSON.stringify(repositoryMap ? {
    analyzedCommitSha: repositoryMap.analyzedCommitSha,
    defaultBranch: repositoryMap.defaultBranch,
    importantDirectories: repositoryMap.importantDirectories,
    manifests: repositoryMap.manifests,
    frameworkConfigFiles: repositoryMap.frameworkConfigFiles,
    architectureDocs: repositoryMap.architectureDocs,
    testFiles: repositoryMap.testFiles,
    applicationEntryPoints: repositoryMap.applicationEntryPoints,
    importantDomainFiles: repositoryMap.importantDomainFiles,
    recentChangedFiles: repositoryMap.recentChangedFiles,
    selectedFiles: repositoryMap.selectedFiles.map(file => ({ path: file.path, source: file.source, content: file.content }))
  } : { unavailable: true }, null, 2)}

CRITICAL GROUNDING RULES:
1. Ground truth regarding what this product actually is and does comes STRICTLY from the Stable Repository Identity (README and Description).
2. ProductProfile Extraction:
   - Extract the ProductProfile strictly from facts verified in the README, description, and verified links.
   - Do NOT invent or extrapolate platforms or distribution channels (e.g. only list Mac App Store, Microsoft Store, Chrome Extension, or Web/PWA if explicitly supported by README/links).
   - Only list privacy characteristics if explicitly stated in the README (e.g. offline-first, local-only).
   - Omit any optional field that is unsupported by evidence rather than guessing.
3. If the monitored activity contains no meaningful changes or only trivial edits (e.g. bumping version numbers, formatting), set "hasMeaningfulContent": false.
4. Do not invent technical decisions that are not evidenced in the commits, PRs, or issues.`;

  try {
    const systemInstruction = "You are a Senior Software Architecture and Product Analyzer. Strictly ground all analysis in the provided repository identity and observed activity.";
    const response = (await callGeminiWithRetry(client, prompt, systemInstruction, synthesizerSchema as any, {
      task: 'deep_synthesis',
      telemetryContext: {
        userId: telemetryContext?.userId,
        feature: 'deep_synthesis',
        repository: `${deepContext.owner}/${deepContext.repo}`,
        isAutomated: telemetryContext?.isAutomated,
        isDemo: telemetryContext?.isDemo,
      }
    })) as SynthesizedContext;

    // Attach deterministic verified properties to the productProfile
    if (response.productProfile) {
      response.productProfile.name = identity.name || deepContext.repo;
      response.productProfile.repositoryUrl = canonicalRepoUrl;
      response.productProfile.homepageUrl = identity.homepageUrl;
      response.productProfile.verifiedLinks = deepContext.verifiedLinks || [];
      response.productProfile.targetUsers = response.productProfile.targetUsers || [];
      response.productProfile.primaryBenefits = response.productProfile.primaryBenefits || [];
      response.productProfile.majorCapabilities = response.productProfile.majorCapabilities || [];
      response.productProfile.platforms = response.productProfile.platforms || [];
      response.productProfile.privacyCharacteristics = response.productProfile.privacyCharacteristics || [];
      response.productProfile.distributionChannels = response.productProfile.distributionChannels || [];
    } else {
      // Fallback deterministic profile if LLM omitted the object
      response.productProfile = {
        name: identity.name || deepContext.repo,
        oneSentencePurpose: identity.description,
        problemSolved: undefined,
        targetUsers: [],
        primaryBenefits: [],
        majorCapabilities: [],
        platforms: [],
        privacyCharacteristics: [],
        distributionChannels: [],
        homepageUrl: identity.homepageUrl,
        repositoryUrl: canonicalRepoUrl,
        verifiedLinks: deepContext.verifiedLinks || []
      };
    }

    response.evidence = buildEvidencePack(deepContext);

    return response;
  } catch (error: any) {
    console.error("Error synthesizing deep context:", error instanceof Error ? error.name : 'unknown error');
    throw new Error(handleGeminiError(error));
  }
}

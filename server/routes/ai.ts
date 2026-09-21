import { Router } from "express";
import { getGeminiClient, handleGeminiError, callGeminiWithRetry } from "../services/repositoryIntelligence/gemini";
import { fetchGithubContext } from "../services/github";
import { analyzeRepositoryAngles, generatePostFromAngle } from "../services/repositoryIntelligence";
import { signAnalysisToken, verifyAnalysisToken } from "../services/repositoryIntelligence/token";
import { performDeepScan } from "../services/deepIntelligence";
import { generateDeepPost } from "../services/deepIntelligence/deepPostGenerator";
import { Type } from "@google/genai";
import { EntitlementUnavailableError, getUserTier, UserTier } from "../services/entitlements";
import { getGithubCredentialForUser, GithubCredentialUnavailableError } from "../services/githubCredentials";
import { getLatestRepositorySnapshot, persistRepositorySnapshot } from "../services/repositoryIntelligence/snapshotStore";
import { consumeAiCapability } from "../services/usageLedger";
import { recordProductEvent } from "../services/productTelemetry";

const router = Router();

const SUPPORTED_LANGUAGES = ["ar", "en", "de"];
const SUPPORTED_INTENTS = ["auto", "project", "technical_decision", "challenge_lesson", "progress_update"];
const SUPPORTED_OPTIMIZATIONS = new Set([
  'style-influencer', 'style-minimalist', 'style-academic', 'style-storyteller', 'style-cynical',
  'add-ascii-architecture', 'add-tech-quiz', 'optimize-seo-pillars', 'unicode', 'hook', 'custom'
]);

async function resolveTierOr503(uid: string, res: any): Promise<UserTier | null> {
  try {
    return await getUserTier(uid);
  } catch (error) {
    if (error instanceof EntitlementUnavailableError || (error as any)?.code === 'ENTITLEMENTS_UNAVAILABLE') {
      res.status(503).json({ error: 'Usage controls are temporarily unavailable. Please try again later.' });
      return null;
    }
    throw error;
  }
}

// Validate username and repo name against standard GitHub naming rules
function isValidGitHubName(name: string): boolean {
  return /^[a-zA-Z0-9_.-]+$/.test(name);
}

function isOptionalBoundedString(value: unknown, maxLength: number): boolean {
  return value === undefined || (typeof value === 'string' && value.length <= maxLength);
}

// Endpoint for registered users to analyze a repo and get angles
router.post("/analyze-repo", async (req: any, res: any) => {
  const { username, repo, projectDescription, lang, intent } = req.body;
  
  if (!username || !repo || typeof username !== 'string' || typeof repo !== 'string' || !isValidGitHubName(username) || !isValidGitHubName(repo)) {
    return res.status(400).json({ error: "Missing or invalid repository information" });
  }
  if (lang && !SUPPORTED_LANGUAGES.includes(lang)) {
    return res.status(400).json({ error: "Unsupported language" });
  }
  const safeIntent = intent || 'auto';
  if (!SUPPORTED_INTENTS.includes(safeIntent) && safeIntent !== 'auto') {
    return res.status(400).json({ error: "Unsupported intent" });
  }
  if (!isOptionalBoundedString(projectDescription, 200)) {
    return res.status(400).json({ error: "Project description exceeds 200 characters" });
  }

  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const tier = await resolveTierOr503(uid, res);
    if (!tier) return;
    const repoUrl = `https://github.com/${username}/${repo}`;
    const ghContext = await fetchGithubContext(repoUrl, await getGithubCredentialForUser(uid));
    
    if (ghContext.hasWeakRepo && !projectDescription) {
      return res.json({ needsUserContext: true });
    }

    // Reserve usage only once the request has enough grounded context to call AI.
    const allowed = await consumeAiCapability(uid, 'repo.analysis', tier);
    if (!allowed) {
      return res.status(429).json({ error: "Repository analysis usage limit reached." });
    }

    const result = await analyzeRepositoryAngles(repoUrl, ghContext, projectDescription, safeIntent, lang, tier);
    
    // Generate Analysis Token for authenticated user
    const canonicalRepo = `github.com/${ghContext.repoData.owner.login.toLowerCase()}/${ghContext.repoData.name.toLowerCase()}`;
    const analysisToken = signAnalysisToken({
      version: 1,
      repository: canonicalRepo,
      lang: lang || 'en',
      intent: safeIntent,
      angles: result.angles,
      atomicFacts: result.atomicFacts,
      conflicts: result.conflicts,
      audience: "authenticated",
      userId: req.user?.uid
    });

    void recordProductEvent(uid, 'analysis_completed', { language: lang || 'en', intent: safeIntent, mode: 'manual' });
    res.json({
      repository: result.repository,
      angles: result.angles,
      analysisToken
    });
  } catch (err: any) {
    if (err instanceof GithubCredentialUnavailableError) {
      return res.status(503).json({ error: 'Private GitHub access is unavailable. Reconnect GitHub or use public repositories.' });
    }
    console.error("AI Analyze Error:", err instanceof Error ? err.name : "unknown");
    void recordProductEvent(req.user?.uid, 'analysis_failed', { language: lang || 'en', intent: intent || 'auto', mode: 'manual' });
    const errorMessage = handleGeminiError(err, lang || 'en');
    res.status(500).json({ error: errorMessage });
  }
});

// Endpoint for registered users to generate a post from an angle
router.post("/generate-post", async (req: any, res: any) => {
  const { username, repo, projectDescription, analysisToken, angleId, customAngle, humanContext, lang } = req.body;
  
  if (!username || !repo || typeof username !== 'string' || typeof repo !== 'string' || !isValidGitHubName(username) || !isValidGitHubName(repo)) {
    return res.status(400).json({ error: "Missing or invalid repository information" });
  }
  if (!analysisToken) {
    return res.status(400).json({ error: "Missing analysis token." });
  }
  if (!angleId && !customAngle) {
    return res.status(400).json({ error: "Either angleId or customAngle is required." });
  }
  if (angleId && customAngle) {
    return res.status(400).json({ error: "Provide either angleId OR customAngle, not both." });
  }
  if (!isOptionalBoundedString(projectDescription, 200) || !isOptionalBoundedString(humanContext, 200)) {
    return res.status(400).json({ error: "Project description or human context exceeds 200 characters" });
  }
  if (!isOptionalBoundedString(customAngle, 200)) {
    return res.status(400).json({ error: "Custom angle exceeds 200 characters" });
  }
  if (lang && !SUPPORTED_LANGUAGES.includes(lang)) return res.status(400).json({ error: "Unsupported language" });

  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const tier = await resolveTierOr503(uid, res);
    if (!tier) return;
    const tokenPayload = verifyAnalysisToken(analysisToken);
    
    if (tokenPayload.audience !== 'authenticated' || tokenPayload.userId !== req.user?.uid) {
      return res.status(403).json({ error: "Invalid token audience or user mismatch." });
    }

    const repoUrl = `https://github.com/${username}/${repo}`;
    const ghContext = await fetchGithubContext(repoUrl, await getGithubCredentialForUser(uid));
    
    const canonicalRepo = `github.com/${ghContext.repoData.owner.login.toLowerCase()}/${ghContext.repoData.name.toLowerCase()}`;
    if (tokenPayload.repository !== canonicalRepo) {
      return res.status(403).json({ error: "Token does not match the requested repository." });
    }
    if (lang && tokenPayload.lang !== lang) {
      return res.status(403).json({ error: "Language mismatch. Token was created for a different language." });
    }

    // Invalid sessions and repository mismatches must not consume AI quota.
    const allowed = await consumeAiCapability(uid, 'post.generate', tier);
    if (!allowed) {
      return res.status(429).json({ error: "Post generation usage limit reached." });
    }

    const result = await generatePostFromAngle(
      tokenPayload, 
      ghContext, 
      projectDescription, 
      angleId, 
      customAngle,
      humanContext, 
      lang,
      tier
    );
    void recordProductEvent(uid, 'post_generated', { language: lang || 'en', mode: 'manual' });
    res.json(result);
  } catch (err: any) {
    if (err instanceof GithubCredentialUnavailableError) {
      return res.status(503).json({ error: 'Private GitHub access is unavailable. Reconnect GitHub or use public repositories.' });
    }
    console.error("AI Generate Error:", err instanceof Error ? err.name : "unknown");
    void recordProductEvent(req.user?.uid, 'post_generation_failed', { language: lang || 'en', mode: 'manual' });
    const errorMessage = handleGeminiError(err, lang || 'en');
    
    if (errorMessage.includes('token') || errorMessage.includes('signature') || errorMessage.includes('Missing')) {
      return res.status(403).json({ error: "Invalid or expired analysis session. Please analyze again." });
    }
    if (errorMessage.includes('Custom angle contradicts') || errorMessage.includes('Generated post contains a blocking claim')) {
      return res.status(422).json({ error: errorMessage });
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Review Engine: Analyze Commits Endpoint (Kept as is for now, as it serves a different purpose)
router.post("/analyze-commits", async (req: any, res: any) => {
  const { commits, repo, lang } = req.body;
  if (!commits || !Array.isArray(commits) || commits.length > 100 || commits.some((commit: any) =>
    !commit || typeof commit.sha !== 'string' || commit.sha.length > 200 || typeof commit.message !== 'string' || commit.message.length > 1000
  )) {
    return res.status(400).json({ error: "Missing or invalid commits array" });
  }
  if (!isOptionalBoundedString(repo, 200) || (lang && !SUPPORTED_LANGUAGES.includes(lang))) {
    return res.status(400).json({ error: "Invalid commit analysis parameters" });
  }

  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const tier = await resolveTierOr503(uid, res);
  if (!tier) return;
  if (!await consumeAiCapability(uid, 'commit.analyze', tier)) {
    return res.status(429).json({ error: "Daily commit analysis limit reached." });
  }
  const client = getGeminiClient(tier);
  if (!client) {
    return res.status(500).json({ error: "Gemini API client is not configured." });
  }

  const systemInstruction = `You are an elite Software Engineer and Technical Writer.
Your job is to review a list of recent commits for a repository and generate a technical update or changelog.
You must output a JSON object with the following fields:
- title: A catchy title for the update.
- changelog: A formatted changelog summarizing the key changes and bug fixes.
- technicalUpdate: A professional technical update paragraph that can be shared in a blog post or newsletter.

Provide the text in the requested language: '${lang}'. If 'ar', write in fluent, professional Arabic. If 'de', write in professional German. Otherwise, use English.`;

  const prompt = `Analyze these recent commits for the repository '${repo}':
${commits.map((c: any) => `- [${c.sha.substring(0, 7)}] ${c.message}`).join('\n')}

Respond strictly with the required JSON structure.`;

  try {
    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        changelog: { type: Type.STRING },
        technicalUpdate: { type: Type.STRING }
      },
      required: ["title", "changelog", "technicalUpdate"]
    };

    const result = await callGeminiWithRetry(client, prompt, systemInstruction, schema as any, {
      task: 'commit_analysis',
      telemetryContext: {
        userId: req.user?.uid,
        feature: 'commit_analysis',
        repository: repo
      }
    });
    
    void recordProductEvent(uid, 'post_generated', { language: lang || 'en', mode: 'commit_analysis' });
    return res.json(result);
  } catch (err: any) {
    console.error("Gemini commit analysis failed:", err instanceof Error ? err.name : "unknown");
    return res.status(500).json({ error: "Failed to generate commit analysis." });
  }
});

// Hashtag Optimization Endpoint (Kept as is)
router.post("/generate-hashtags", async (req: any, res: any) => {
  const { text, lang } = req.body;
  if (typeof text !== 'string' || text.trim().length === 0 || text.length > 20000 || (lang && !SUPPORTED_LANGUAGES.includes(lang))) {
    return res.status(400).json({ error: "Missing text parameter" });
  }

  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const tier = await resolveTierOr503(uid, res);
  if (!tier) return;
  if (!await consumeAiCapability(uid, 'hashtags.generate', tier)) {
    return res.status(429).json({ error: "Daily hashtag generation limit reached." });
  }
  const client = getGeminiClient(tier);
  if (!client) {
    return res.status(500).json({ error: "Gemini API client is not configured." });
  }

  const systemInstruction = `Suggest exactly 5-8 highly relevant, high-traffic professional hashtags for the provided LinkedIn post.
Return ONLY a JSON array of strings, where each string is a hashtag starting with #. Do not include extra text.`;

  const prompt = `Post text: ${text}`;

  try {
    const schema = {
      type: Type.OBJECT,
      properties: {
        hashtags: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["hashtags"]
    };

    const result = await callGeminiWithRetry(client, prompt, systemInstruction, schema as any, {
      task: 'hashtag_generation',
      telemetryContext: {
        userId: req.user?.uid,
        feature: 'hashtag_generation'
      }
    });

    void recordProductEvent(uid, 'hashtags_generated', { language: lang || 'en', characterCount: text.length, mode: 'manual' });
    return res.json(result);
  } catch (err: any) {
    console.error("Hashtag generation error:", err instanceof Error ? err.name : "unknown");
    return res.status(500).json({ error: "Failed to generate hashtags." });
  }
});

// Evidence-preserving draft refinement. This endpoint never fetches GitHub and
// must not invent facts; it only rewrites user-provided draft text.
router.post("/optimize-post", async (req: any, res: any) => {
  const { text, actionType, customPrompt, lang } = req.body || {};
  if (typeof text !== 'string' || text.trim().length === 0 || text.length > 20000) {
    return res.status(400).json({ error: 'Missing or invalid draft text.' });
  }
  if (typeof actionType !== 'string' || !SUPPORTED_OPTIMIZATIONS.has(actionType)) {
    return res.status(400).json({ error: 'Unsupported draft refinement.' });
  }
  if (lang && !SUPPORTED_LANGUAGES.includes(lang)) {
    return res.status(400).json({ error: 'Unsupported language' });
  }
  if (customPrompt !== undefined && (typeof customPrompt !== 'string' || customPrompt.length > 300)) {
    return res.status(400).json({ error: 'Custom refinement is too long.' });
  }

  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const tier = await resolveTierOr503(uid, res);
  if (!tier) return;
  if (!await consumeAiCapability(uid, 'post.optimize', tier)) {
    return res.status(429).json({ error: 'Daily AI optimization limit reached.' });
  }
  const client = getGeminiClient(tier);
  if (!client) return res.status(500).json({ error: 'Gemini API client is not configured.' });

  const instruction = actionType === 'custom'
    ? customPrompt || 'Improve clarity and structure.'
    : `Apply this bounded writing refinement: ${actionType}.`;
  const systemInstruction = `You edit an existing technical LinkedIn draft. Preserve every factual claim, number, project name, URL, and uncertainty level from the input. Do not add achievements, metrics, outcomes, audience reactions, or claims that are not already present. If a requested refinement would require new facts, leave that part unchanged. Return only JSON with optimizedText. Write in ${lang === 'ar' ? 'professional Arabic' : lang === 'de' ? 'professional German' : 'professional English'}.`;
  const prompt = `Refinement instruction: ${instruction}\n\nDraft:\n${text}`;

  try {
    const result = await callGeminiWithRetry(client, prompt, systemInstruction, {
      type: Type.OBJECT,
      properties: { optimizedText: { type: Type.STRING } },
      required: ['optimizedText']
    } as any, {
      task: 'post_optimize',
      telemetryContext: { userId: uid, feature: 'post_optimize' }
    });
    if (!result || typeof result.optimizedText !== 'string' || result.optimizedText.trim().length === 0) {
      return res.status(502).json({ error: 'The draft refinement returned no usable text.' });
    }
    void recordProductEvent(uid, 'draft_edited', { mode: 'ai_refinement', actionType });
    return res.json({ optimizedText: result.optimizedText });
  } catch (error) {
    console.error('Draft refinement failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(500).json({ error: 'Failed to refine the draft.' });
  }
});

// Deep Scan Endpoint (Beta)
router.post("/deep-scan", async (req: any, res: any) => {
  const { username, repo, lang } = req.body;

  if (!username || !repo || typeof username !== 'string' || typeof repo !== 'string' || !isValidGitHubName(username) || !isValidGitHubName(repo)) {
    return res.status(400).json({ error: "Missing or invalid repository information" });
  }

  const requestedLang = lang && SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
  if (lang && !SUPPORTED_LANGUAGES.includes(lang)) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    const { username, repo, lang, intent, targetAudience } = req.body;
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    // Assuming Deep Scan is a premium/heavy feature, lower rate limit
    const tier = await resolveTierOr503(uid, res);
    if (!tier) return;
    const allowed = await consumeAiCapability(uid, 'repo.deep_scan', tier);
    if (!allowed) {
      return res.status(429).json({ error: "Daily deep scan limit reached." });
    }

    const repoUrl = `https://github.com/${username}/${repo}`;

    // 1. Fetch & Synthesize Deep Context
    const previousSnapshot = await getLatestRepositorySnapshot(uid, username, repo);
    const scanResult = await performDeepScan(repoUrl, await getGithubCredentialForUser(uid), undefined, tier, previousSnapshot, {
      userId: uid,
      feature: 'deep_scan',
      repository: `${username}/${repo}`,
      isAutomated: false,
    });
    await persistRepositorySnapshot(uid, scanResult.githubContext, scanResult.synthesizedContext);

    // 2. Generate Final Post
    const finalPost = await generateDeepPost(
      scanResult.synthesizedContext, 
      repoUrl, 
      requestedLang,
      {
        intent: intent || 'weekly_progress',
        targetAudience: targetAudience || 'General Public',
        repoIdentity: scanResult.githubContext.repoIdentity ? {
          name: scanResult.githubContext.repoIdentity.name,
          description: scanResult.githubContext.repoIdentity.description
        } : undefined,
        userId: uid,
        isAutomated: false
      },
      tier
    );

    void recordProductEvent(uid, 'post_generated', { language: requestedLang, mode: 'deep_scan' });
    return res.json({
      success: true,
      repository: {
        owner: scanResult.githubContext.owner,
        name: scanResult.githubContext.repo,
      },
      synthesizedContext: scanResult.synthesizedContext,
      post: finalPost.post,
      suggestedComment: finalPost.suggestedComment,
      claimAudit: finalPost.claimAudit,
      qualityEvaluation: finalPost.qualityEvaluation
    });

  } catch (error: any) {
    if (error instanceof GithubCredentialUnavailableError) {
      return res.status(503).json({ error: 'Private GitHub access is unavailable. Reconnect GitHub or use public repositories.' });
    }
    console.error("Deep scan failed:", error instanceof Error ? error.name : "unknown");
    let errorMessage = "Failed to perform deep scan.";
    const rawErrorMessage = error instanceof Error ? error.message : String(error || '');
    
    // Check if it's a Gemini API quota error
    if (rawErrorMessage.includes("429") || rawErrorMessage.includes("Quota exceeded") || rawErrorMessage.includes("RESOURCE_EXHAUSTED")) {
      errorMessage = requestedLang === 'ar' 
        ? "تم تجاوز الحد المسموح للاستخدام المجاني للذكاء الاصطناعي. يرجى المحاولة مرة أخرى بعد قليل." 
        : "AI model free tier quota exceeded. Please try again in a moment.";
    }

    return res.status(500).json({ error: errorMessage });
  }
});

export default router;

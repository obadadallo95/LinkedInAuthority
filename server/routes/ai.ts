import { Router } from "express";
import { getGeminiClient, handleGeminiError, callGeminiWithRetry } from "../services/repositoryIntelligence/gemini";
import { fetchGithubContext } from "../services/github";
import { analyzeRepositoryAngles, generatePostFromAngle } from "../services/repositoryIntelligence";
import { signAnalysisToken, verifyAnalysisToken } from "../services/repositoryIntelligence/token";
import { performDeepScan } from "../services/deepIntelligence";
import { generateDeepPost } from "../services/deepIntelligence/deepPostGenerator";
import { Type } from "@google/genai";
import { rateLimitStore } from "../services/rateLimitStore";
import { getUserTier } from "../services/entitlements";

const router = Router();

const SUPPORTED_LANGUAGES = ["ar", "en", "de"];
const SUPPORTED_INTENTS = ["auto", "project", "technical_decision", "challenge_lesson", "progress_update"];

// Validate username and repo name against standard GitHub naming rules
function isValidGitHubName(name: string): boolean {
  return /^[a-zA-Z0-9_.-]+$/.test(name);
}

// Endpoint for registered users to analyze a repo and get angles
router.post("/analyze-repo", async (req: any, res: any) => {
  const { username, token, repo, projectDescription, lang, intent } = req.body;
  
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
  if (projectDescription && projectDescription.length > 200) {
    return res.status(400).json({ error: "Project description exceeds 200 characters" });
  }

  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const allowed = await rateLimitStore.checkAndIncrement(uid, 'analyze', 50, 60 * 60 * 1000); // 50 per hour
    if (!allowed) {
      return res.status(429).json({ error: "Hourly limit of 50 analyses reached." });
    }
    const repoUrl = `https://github.com/${username}/${repo}`;
    // Pass the user's Github token if available
    const ghContext = await fetchGithubContext(repoUrl, token);
    
    if (ghContext.hasWeakRepo && !projectDescription) {
      return res.json({ needsUserContext: true });
    }

    const tier = await getUserTier(uid);
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

    res.json({
      repository: result.repository,
      angles: result.angles,
      analysisToken
    });
  } catch (err: any) {
    console.error("AI Analyze Error:", err);
    const errorMessage = handleGeminiError(err, lang || 'en');
    res.status(500).json({ error: errorMessage });
  }
});

// Endpoint for registered users to generate a post from an angle
router.post("/generate-post", async (req: any, res: any) => {
  const { username, token, repo, projectDescription, analysisToken, angleId, customAngle, humanContext, lang } = req.body;
  
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
  if (humanContext && humanContext.length > 200) {
    return res.status(400).json({ error: "Human context exceeds 200 characters" });
  }
  if (customAngle && customAngle.length > 200) {
    return res.status(400).json({ error: "Custom angle exceeds 200 characters" });
  }

  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const allowed = await rateLimitStore.checkAndIncrement(uid, 'generate', 50, 60 * 60 * 1000); // 50 per hour
    if (!allowed) {
      return res.status(429).json({ error: "Hourly limit of 50 generations reached." });
    }
    const tokenPayload = verifyAnalysisToken(analysisToken);
    
    if (tokenPayload.audience !== 'authenticated' || tokenPayload.userId !== req.user?.uid) {
      return res.status(403).json({ error: "Invalid token audience or user mismatch." });
    }

    const repoUrl = `https://github.com/${username}/${repo}`;
    const ghContext = await fetchGithubContext(repoUrl, token);
    
    const canonicalRepo = `github.com/${ghContext.repoData.owner.login.toLowerCase()}/${ghContext.repoData.name.toLowerCase()}`;
    if (tokenPayload.repository !== canonicalRepo) {
      return res.status(403).json({ error: "Token does not match the requested repository." });
    }
    if (lang && tokenPayload.lang !== lang) {
      return res.status(403).json({ error: "Language mismatch. Token was created for a different language." });
    }

    const tier = await getUserTier(uid);
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
    res.json(result);
  } catch (err: any) {
    console.error("AI Generate Error:", err);
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
  if (!commits || !Array.isArray(commits)) {
    return res.status(400).json({ error: "Missing or invalid commits array" });
  }

  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const client = getGeminiClient(await getUserTier(uid));
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
    
    return res.json(result);
  } catch (err: any) {
    console.error("Gemini commit analysis failed:", err);
    return res.status(500).json({ error: "Failed to generate commit analysis." });
  }
});

// Hashtag Optimization Endpoint (Kept as is)
router.post("/generate-hashtags", async (req: any, res: any) => {
  const { text, lang } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing text parameter" });
  }

  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const client = getGeminiClient(await getUserTier(uid));
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

    return res.json(result);
  } catch (err: any) {
    console.error("Hashtag generation error:", err);
    return res.status(500).json({ error: "Failed to generate hashtags." });
  }
});

// Deep Scan Endpoint (Beta)
router.post("/deep-scan", async (req: any, res: any) => {
  const { username, repo, token, lang } = req.body;

  if (!username || !repo || typeof username !== 'string' || typeof repo !== 'string' || !isValidGitHubName(username) || !isValidGitHubName(repo)) {
    return res.status(400).json({ error: "Missing or invalid repository information" });
  }

  const requestedLang = lang && SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';

  try {
    const { username, repo, token, lang, intent, targetAudience } = req.body;
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    // Assuming Deep Scan is a premium/heavy feature, lower rate limit
    const allowed = await rateLimitStore.checkAndIncrement(uid, 'deep-scan', 20, 60 * 60 * 1000); 
    if (!allowed) {
      return res.status(429).json({ error: "Hourly limit of 20 deep scans reached." });
    }

    const repoUrl = `https://github.com/${username}/${repo}`;

    // 1. Fetch & Synthesize Deep Context
    const tier = await getUserTier(uid);
    const scanResult = await performDeepScan(repoUrl, token, undefined, tier);

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
        } : undefined
      },
      tier
    );

    return res.json({
      success: true,
      repository: {
        owner: scanResult.githubContext.owner,
        name: scanResult.githubContext.repo,
      },
      synthesizedContext: scanResult.synthesizedContext,
      post: finalPost.post,
      suggestedComment: finalPost.suggestedComment
    });

  } catch (error: any) {
    console.error("Deep scan failed:", error);
    let errorMessage = error.message || "Failed to perform deep scan.";
    
    // Check if it's a Gemini API quota error
    if (errorMessage.includes("429") || errorMessage.includes("Quota exceeded") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      errorMessage = requestedLang === 'ar' 
        ? "تم تجاوز الحد المسموح للاستخدام المجاني للذكاء الاصطناعي. يرجى المحاولة مرة أخرى بعد قليل." 
        : "AI model free tier quota exceeded. Please try again in a moment.";
    }

    return res.status(500).json({ error: errorMessage });
  }
});

export default router;

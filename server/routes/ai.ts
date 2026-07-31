import { Router } from "express";
import { getGeminiClient } from "../services/repositoryIntelligence/gemini";
import { fetchGithubContext } from "../services/github";
import { analyzeRepositoryAngles, generatePostFromAngle } from "../services/repositoryIntelligence";
import { signAnalysisToken, verifyAnalysisToken } from "../services/repositoryIntelligence/token";
import { Type } from "@google/genai";

const router = Router();

// Endpoint for registered users to analyze a repo and get angles
router.post("/analyze-repo", async (req: any, res: any) => {
  const { username, token, repo, projectDescription, lang, intent } = req.body;
  
  if (!username || !repo || typeof username !== 'string' || typeof repo !== 'string') {
    return res.status(400).json({ error: "Missing or invalid repository information" });
  }
  if (lang && !['ar', 'en', 'de'].includes(lang)) {
    return res.status(400).json({ error: "Unsupported language" });
  }
  if (projectDescription && projectDescription.length > 200) {
    return res.status(400).json({ error: "Project description exceeds 200 characters" });
  }

  const safeIntent = intent || 'auto';

  try {
    const repoUrl = `https://github.com/${username}/${repo}`;
    // Pass the user's Github token if available
    const ghContext = await fetchGithubContext(repoUrl, token);
    
    if (ghContext.hasWeakRepo && !projectDescription) {
      return res.json({ needsUserContext: true });
    }

    const result = await analyzeRepositoryAngles(repoUrl, ghContext, projectDescription, safeIntent, lang);
    
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
    res.status(500).json({ error: err.message || "Failed to analyze repository" });
  }
});

// Endpoint for registered users to generate a post from an angle
router.post("/generate-post", async (req: any, res: any) => {
  const { username, token, repo, projectDescription, analysisToken, angleId, customAngle, humanContext, lang } = req.body;
  
  if (!username || !repo || typeof username !== 'string' || typeof repo !== 'string') {
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

    const result = await generatePostFromAngle(
      tokenPayload, 
      ghContext, 
      projectDescription, 
      angleId, 
      customAngle,
      humanContext, 
      lang
    );
    res.json(result);
  } catch (err: any) {
    console.error("AI Generate Error:", err);
    if (err.message.includes('token') || err.message.includes('signature')) {
      return res.status(403).json({ error: "Invalid or expired analysis session. Please analyze again." });
    }
    res.status(500).json({ error: err.message || "Failed to generate post" });
  }
});

// Review Engine: Analyze Commits Endpoint (Kept as is for now, as it serves a different purpose)
router.post("/analyze-commits", async (req: any, res: any) => {
  const { commits, repo, lang } = req.body;
  if (!commits || !Array.isArray(commits)) {
    return res.status(400).json({ error: "Missing or invalid commits array" });
  }

  const client = getGeminiClient();
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
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            changelog: { type: Type.STRING },
            technicalUpdate: { type: Type.STRING }
          },
          required: ["title", "changelog", "technicalUpdate"]
        }
      }
    });
    
    if (response.text) {
      return res.json(JSON.parse(response.text));
    }
  } catch (err: any) {
    console.error("Gemini commit analysis failed:", err);
    return res.status(500).json({ error: "Failed to generate commit analysis." });
  }
  
  return res.status(500).json({ error: "Empty AI response." });
});

// Hashtag Optimization Endpoint (Kept as is)
router.post("/generate-hashtags", async (req: any, res: any) => {
  const { text, lang } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing text parameter" });
  }

  const client = getGeminiClient();
  if (!client) {
    return res.status(500).json({ error: "Gemini API client is not configured." });
  }

  const systemInstruction = `Suggest exactly 5-8 highly relevant, high-traffic professional hashtags for the provided LinkedIn post.
Return ONLY a JSON array of strings, where each string is a hashtag starting with #. Do not include extra text.`;

  const prompt = `Post text: ${text}`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["hashtags"]
        }
      }
    });

    const outText = response.text;
    if (outText) {
      const parsed = JSON.parse(outText);
      return res.json(parsed);
    } else {
      throw new Error("Empty response");
    }
  } catch (err: any) {
    console.error("Hashtag generation error:", err);
    return res.status(500).json({ error: "Failed to generate hashtags." });
  }
});

export default router;

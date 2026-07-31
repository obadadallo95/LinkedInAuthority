import { Router } from "express";
import { getGeminiClient } from "../services/repositoryIntelligence/gemini";
import { fetchGithubContext } from "../services/github";
import { analyzeRepositoryAngles, generatePostFromAngle } from "../services/repositoryIntelligence";
import { Type } from "@google/genai";

const router = Router();

// Endpoint for registered users to analyze a repo and get angles
router.post("/analyze-repo", async (req: any, res: any) => {
  const { username, token, repo, projectDescription, lang, intent = 'auto' } = req.body;
  
  if (!username || !repo) {
    return res.status(400).json({ error: "Missing repository information" });
  }

  try {
    const repoUrl = `https://github.com/${username}/${repo}`;
    // Pass the user's Github token if available
    const ghContext = await fetchGithubContext(repoUrl, token);
    
    if (ghContext.hasWeakRepo && !projectDescription) {
      return res.json({ needsUserContext: true });
    }

    const result = await analyzeRepositoryAngles(repoUrl, ghContext, projectDescription, intent, lang);
    res.json(result);
  } catch (err: any) {
    console.error("AI Analyze Error:", err);
    res.status(500).json({ error: err.message || "Failed to analyze repository" });
  }
});

// Endpoint for registered users to generate a post from an angle
router.post("/generate-post", async (req: any, res: any) => {
  const { username, token, repo, projectDescription, angleId, humanContext, lang } = req.body;
  
  if (!username || !repo || !angleId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const repoUrl = `https://github.com/${username}/${repo}`;
    const ghContext = await fetchGithubContext(repoUrl, token);
    
    const result = await generatePostFromAngle(repoUrl, ghContext, projectDescription, angleId, humanContext, lang);
    res.json(result);
  } catch (err: any) {
    console.error("AI Generate Error:", err);
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

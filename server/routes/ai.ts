import { Router } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import fetch from "node-fetch";

const router = Router();

// Lazy-initialized Gemini Client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
export function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is missing.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// LinkedIn Authority Codebase Analysis Endpoint
router.post("/analyze-repo", async (req: any, res: any) => {
  const { username, token, repo, branch, template, lang } = req.body;
  if (!repo) {
    return res.status(400).json({ error: "Missing repository name parameter" });
  }

  let readmeContent = "";
  let repoDescription = "";

  // 1. Attempt to fetch public metadata from GitHub API to make it real
  if (username) {
    try {
      const headers: { [key: string]: string } = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "LinkedIn-Authority-App"
      };
      if (token) {
        headers["Authorization"] = `token ${token}`;
      }

      // Fetch repo metadata
      const repoRes = await fetch(`https://api.github.com/repos/${username}/${repo}`, { headers });
      if (repoRes.ok) {
        const repoData: any = await repoRes.json();
        repoDescription = repoData.description || "";
      }

      // Fetch README content
      const readmeRes = await fetch(`https://api.github.com/repos/${username}/${repo}/readme${branch ? `?ref=${branch}` : ''}`, { headers });
      if (readmeRes.ok) {
        const readmeData: any = await readmeRes.json();
        if (readmeData.content && readmeData.encoding === "base64") {
          const buffer = Buffer.from(readmeData.content, "base64");
          readmeContent = buffer.toString("utf8");
        }
      }
    } catch (err) {
      console.error("GitHub API error:", err);
    }
  }

  if (!readmeContent && !repoDescription) {
    return res.status(400).json({ error: "Could not fetch repository data. Ensure the repository exists and the GitHub token has the correct permissions." });
  }

  const client = getGeminiClient();
  if (!client) {
    return res.status(500).json({ error: "Gemini API client is not configured. Please add GEMINI_API_KEY in the settings." });
  }

  const systemInstruction = `You are an expert technical content marketer and developer advocate.
Your job is to read the codebase info (README or description) of a developer's GitHub repository and draft exactly three distinct, high-impact LinkedIn posts.
The posts must be engaging, use clean spacing, code-friendly emojis, and have a highly professional developer-advocate / executive tone.
Do not include hashtags inside the 'text' of the posts; those are generated separately.
Create 3 different template types:
1. 'Engineering Focus' (technical achievements, patterns used, design system benefits)
2. 'Architectural Details' (structural layout, modularity, deep tech stack analysis)
3. 'Short Summary' (concise, value proposition, bento-style highlights)

Provide the text in the requested language: '${lang}'.
If the requested language is Arabic ('ar'), write the posts in professional, fluent, engaging native Arabic. If German ('de'), write in high-quality professional German. Otherwise, use English ('en').

Also, customize a beautiful 'cardConfig' visual preview for each post:
- 'colorTheme' should be one of: 'indigo', 'emerald', 'amber', 'rose', 'teal'
- 'title' must be a short 2-3 word English title suitable for a graphical banner
- 'subtitle' must be a short 5-6 word tagline description (keep it in English for professional appearance)
- 'metrics' must be a high-level metric like '98% SPEED' or 'SEO ACTIVE' or 'VITE READY'`;

  const prompt = `Generate exactly 3 professional LinkedIn posts and card configs for the repository '${repo}'.
Repository Description: ${repoDescription}
README File Content Preview:
${readmeContent.slice(0, 4000)}

Respond strictly with valid JSON.`;

  let responseText = "";
  try {
    // First tier: gemini-3.5-flash
    console.log("Analyzing repository with primary model: gemini-3.5-flash");
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            posts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  cardConfig: {
                    type: Type.OBJECT,
                    properties: {
                      colorTheme: { type: Type.STRING },
                      title: { type: Type.STRING },
                      subtitle: { type: Type.STRING },
                      metrics: { type: Type.STRING }
                    },
                    required: ["colorTheme", "title", "subtitle", "metrics"]
                  }
                },
                required: ["text", "cardConfig"]
              }
            }
          },
          required: ["posts"]
        }
      }
    });
    responseText = response.text || "";
  } catch (e: any) {
    console.warn("Primary gemini-3.5-flash model failed or unavailable. Attempting fallback model gemini-3.1-flash-lite. Error:", e.message || e);
    try {
      // Second tier: gemini-3.1-flash-lite
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              posts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    cardConfig: {
                      type: Type.OBJECT,
                      properties: {
                        colorTheme: { type: Type.STRING },
                        title: { type: Type.STRING },
                        subtitle: { type: Type.STRING },
                        metrics: { type: Type.STRING }
                      },
                      required: ["colorTheme", "title", "subtitle", "metrics"]
                    }
                  },
                  required: ["text", "cardConfig"]
                }
              }
            },
            required: ["posts"]
          }
        }
      });
      responseText = response.text || "";
    } catch (fallbackErr: any) {
      console.error("Both primary gemini-3.5-flash and fallback gemini-3.1-flash-lite models failed:", fallbackErr.message || fallbackErr);
    }
  }

  if (responseText) {
    try {
      const parsed = JSON.parse(responseText);
      if (parsed && Array.isArray(parsed.posts) && parsed.posts.length > 0) {
        return res.json(parsed);
      }
    } catch (parseErr: any) {
      console.error("Failed to parse response text from Gemini:", parseErr.message || parseErr);
    }
  }

  // Tier 3: Pre-computed highly customized fallback
  console.error("Failed to generate posts from AI for repo:", repo);
  return res.status(500).json({ error: "Failed to generate posts from AI." });
});

// Hashtag Optimization Endpoint
router.post("/generate-hashtags", async (req: any, res: any) => {
  const { text, lang } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing text parameter" });
  }

  const client = getGeminiClient();
  if (!client) {
    // Safe high-quality fallback hashtags
    return res.status(500).json({ error: "Gemini API client is not configured." });
  }

  const systemInstruction = `Suggest exactly 5-8 highly relevant, high-traffic professional hashtags for the provided LinkedIn post.
Return ONLY a JSON array of strings, where each string is a hashtag starting with #. Do not include extra text.`;

  const prompt = `Post text: ${text}`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
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

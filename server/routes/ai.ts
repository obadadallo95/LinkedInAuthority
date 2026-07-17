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
  const { username, token, repo, branch, tone, referenceTemplateText, customFiles, lang } = req.body;
  if (!repo) {
    return res.status(400).json({ error: "Missing repository name parameter" });
  }

  let readmeContent = "";
  let repoDescription = "";
  let packageJsonContent = "";

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

      // Fetch Custom Files if provided, otherwise fetch README
      if (customFiles && typeof customFiles === 'string' && customFiles.trim().length > 0) {
        const filePaths = customFiles.split(',').map(f => f.trim()).filter(f => f.length > 0);
        let customContent = '';
        for (const filePath of filePaths) {
          const fileRes = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${filePath}${branch ? `?ref=${branch}` : ''}`, { headers });
          if (fileRes.ok) {
            const fileData: any = await fileRes.json();
            if (fileData.content && fileData.encoding === "base64") {
              const buffer = Buffer.from(fileData.content, "base64");
              customContent += `\n\n--- File: ${filePath} ---\n${buffer.toString("utf8")}`;
            }
          }
        }
        readmeContent = customContent;
      } else {
        // Fetch README content
        const readmeRes = await fetch(`https://api.github.com/repos/${username}/${repo}/readme${branch ? `?ref=${branch}` : ''}`, { headers });
        if (readmeRes.ok) {
          const readmeData: any = await readmeRes.json();
          if (readmeData.content && readmeData.encoding === "base64") {
            const buffer = Buffer.from(readmeData.content, "base64");
            readmeContent = buffer.toString("utf8");
          }
        }
      }

      // Fetch package.json content for tech stack context
      const pkgRes = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/package.json${branch ? `?ref=${branch}` : ''}`, { headers });
      if (pkgRes.ok) {
        const pkgData: any = await pkgRes.json();
        if (pkgData.content && pkgData.encoding === "base64") {
          const buffer = Buffer.from(pkgData.content, "base64");
          try {
            const pkgJson = JSON.parse(buffer.toString("utf8"));
            // Extract only dependencies to save prompt tokens
            packageJsonContent = JSON.stringify({
              dependencies: pkgJson.dependencies || {},
              devDependencies: pkgJson.devDependencies || {}
            });
          } catch(e) {
            packageJsonContent = buffer.toString("utf8").slice(0, 1000); // fallback
          }
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

  const systemInstruction = `You are an elite Developer Advocate and Technical Copywriter.
Your job is to read the codebase info (README, description, and package.json dependencies) of a developer's GitHub repository and draft EXACTLY ONE high-impact, ultra-premium LinkedIn post.
The post must be engaging, use clean spacing, code-friendly emojis, and have a highly professional executive tone.
Do not include hashtags inside the 'text' of the post; those are generated separately.

CRITICAL INSTRUCTIONS:
1. You must write the post using the requested tone/framework: '${tone || 'technical'}'. 
   - If 'Marketing (PAS)', use Problem-Agitation-Solution framework.
   - If 'Storytelling', focus on the journey of building the project.
   - If 'Technical', deep dive into the architecture and tech stack.
   - If 'Executive Summary', focus on value proposition and metrics.
2. If a 'Reference Template' is provided, use its style, structure, and formatting as a strict guide for your post. Fill in the placeholders from the template with actual details from the repository.
3. Analyze the provided package.json dependencies to mention specific tech stack tools (e.g., React, Tailwind, Prisma) to make the post authentic and deeply technical.

Provide the text in the requested language: '${lang}'.
If the requested language is Arabic ('ar'), write the post in professional, fluent, engaging native Arabic. If German ('de'), write in high-quality professional German. Otherwise, use English ('en').

Also, customize a beautiful 'cardConfig' visual preview for the post:
- 'colorTheme' should be one of: 'indigo', 'emerald', 'amber', 'rose', 'teal'
- 'title' must be a short 2-3 word English title suitable for a graphical banner
- 'subtitle' must be a short 5-6 word tagline description (keep it in English for professional appearance)
- 'metrics' must be a high-level metric like '98% SPEED' or 'SEO ACTIVE' or 'VITE READY' based on the tech stack.`;

  const prompt = `Generate exactly 1 professional LinkedIn post and card config for the repository '${repo}'.
Repository Description: ${repoDescription}
Tech Stack (package.json): ${packageJsonContent || 'Not available'}
Requested Tone: ${tone || 'technical'}
Reference Template Style (follow this closely if provided):
${referenceTemplateText || 'No specific template provided. Write a compelling post.'}

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

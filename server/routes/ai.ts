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

// Technical Project Analysis Endpoint
router.post("/analyze-repo", async (req: any, res: any) => {
  const { username, token, repo, branch, lang } = req.body;
  if (!repo) {
    return res.status(400).json({ error: "Missing repository name parameter" });
  }

  let readmeContent = "";
  let repoDescription = "";
  let packageJsonContent = "";
  let fileTreeContent = "";

  if (username) {
    try {
      const headers: { [key: string]: string } = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Tech-Doc-Generator"
      };
      if (token) {
        headers["Authorization"] = `token ${token}`;
      }

      // 1. Fetch repo metadata
      const repoRes = await fetch(`https://api.github.com/repos/${username}/${repo}`, { headers });
      if (repoRes.ok) {
        const repoData: any = await repoRes.json();
        repoDescription = repoData.description || "";
      }

      // 2. Fetch README content
      const readmeRes = await fetch(`https://api.github.com/repos/${username}/${repo}/readme${branch ? `?ref=${branch}` : ''}`, { headers });
      if (readmeRes.ok) {
        const readmeData: any = await readmeRes.json();
        if (readmeData.content && readmeData.encoding === "base64") {
          readmeContent = Buffer.from(readmeData.content, "base64").toString("utf8");
        }
      }

      // 3. Fetch package.json content for tech stack
      const pkgRes = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/package.json${branch ? `?ref=${branch}` : ''}`, { headers });
      if (pkgRes.ok) {
        const pkgData: any = await pkgRes.json();
        if (pkgData.content && pkgData.encoding === "base64") {
          try {
            const pkgJson = JSON.parse(Buffer.from(pkgData.content, "base64").toString("utf8"));
            packageJsonContent = JSON.stringify({
              dependencies: pkgJson.dependencies || {},
              devDependencies: pkgJson.devDependencies || {}
            });
          } catch(e) {}
        }
      }

      // 4. Fetch file tree
      const treeRes = await fetch(`https://api.github.com/repos/${username}/${repo}/git/trees/${branch || 'main'}?recursive=1`, { headers });
      if (treeRes.ok) {
        const treeData: any = await treeRes.json();
        if (treeData.tree) {
          // Keep only file paths, limit to 500 files to avoid massive prompts
          const paths = treeData.tree.filter((t: any) => t.type === 'blob').map((t: any) => t.path).slice(0, 500);
          fileTreeContent = paths.join('\n');
        }
      }
    } catch (err) {
      console.error("GitHub API error:", err);
    }
  }

  if (!readmeContent && !repoDescription && !fileTreeContent) {
    return res.status(400).json({ error: "Could not fetch repository data. Ensure the repository exists and the GitHub token has the correct permissions." });
  }

  const client = getGeminiClient();
  if (!client) {
    return res.status(500).json({ error: "Gemini API client is not configured. Please add GEMINI_API_KEY in the settings." });
  }

  const systemInstruction = `You are an elite Software Architect and Technical Writer.
Your job is to read the codebase info (README, description, file tree, and package.json dependencies) of a developer's GitHub repository and generate a comprehensive technical analysis.
You must output a JSON object with the following fields:
- summary: A clear, concise overview of what the project does and its main value proposition (1-2 paragraphs).
- techStack: An array of strings listing the core technologies, frameworks, and languages used.
- architecture: A description of the likely architecture, patterns, and structure of the project based on the file tree and dependencies.
- potentialContent: A draft of a technical update or blog post introducing this project, ready for the developer to edit and share.

Provide the text in the requested language: '${lang}'. If 'ar', write in fluent, professional Arabic. If 'de', write in professional German. Otherwise, use English.`;

  const prompt = `Analyze the repository '${repo}'.
Repository Description: ${repoDescription}
Tech Stack (package.json): ${packageJsonContent || 'Not available'}
File Tree:
${fileTreeContent.slice(0, 10000) || 'Not available'}

README Content:
${readmeContent.slice(0, 6000)}

Respond strictly with the required JSON structure.`;

  let responseText = "";
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
            summary: { type: Type.STRING },
            techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
            architecture: { type: Type.STRING },
            potentialContent: { type: Type.STRING }
          },
          required: ["summary", "techStack", "architecture", "potentialContent"]
        }
      }
    });
    responseText = response.text || "";
  } catch (e: any) {
    console.error("Gemini model failed:", e.message || e);
    return res.status(500).json({ error: "Failed to generate analysis from AI." });
  }

  if (responseText) {
    try {
      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (parseErr: any) {
      console.error("Failed to parse response text from Gemini:", parseErr.message || parseErr);
      return res.status(500).json({ error: "Failed to parse AI response." });
    }
  }

  return res.status(500).json({ error: "Empty AI response." });
});

// Review Engine: Analyze Commits Endpoint
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
      model: "gemini-3.5-flash",
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

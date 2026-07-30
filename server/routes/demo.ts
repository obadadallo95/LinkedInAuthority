import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

// Initialize Gemini for the backend (requires GEMINI_API_KEY env var on the server)
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({ apiKey: geminiApiKey });
}

router.post("/", async (req, res) => {
  try {
    const { repoUrl, lang } = req.body;
    
    if (!repoUrl) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    if (!ai) {
      return res.status(503).json({ error: "Demo mode is currently unavailable. Server missing GEMINI_API_KEY." });
    }

    // Extract owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ error: "Invalid GitHub URL format" });
    }
    
    const owner = match[1];
    const repo = match[2].replace(".git", "");

    // Fetch repository data from GitHub public API
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoRes.ok) {
      return res.status(404).json({ error: "Repository not found or private" });
    }
    
    const repoData = await repoRes.json();
    
    // Fetch README (if available)
    let readmeText = "";
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: { "Accept": "application/vnd.github.v3.raw" }
    });
    
    if (readmeRes.ok) {
      readmeText = await readmeRes.text();
      // Truncate readme to avoid hitting token limits for the demo
      readmeText = readmeText.substring(0, 1500); 
    }

    const languageInstruction = lang === 'ar' 
      ? 'اكتب المنشور باللغة العربية الاحترافية والتقنية.' 
      : lang === 'de'
      ? 'Schreibe den Beitrag in professionellem und technischem Deutsch.'
      : 'Write the post in professional technical English.';

    const prompt = `
      Act as an expert Developer Advocate and LinkedIn content creator.
      I have a GitHub repository named "${repoData.name}" by "${repoData.owner.login}".
      Description: ${repoData.description || "No description provided."}
      Primary Language: ${repoData.language || "Unknown"}
      Stars: ${repoData.stargazers_count}
      
      Here is a snippet of the README:
      ${readmeText}
      
      Please write a highly engaging, professional LinkedIn post introducing this open-source project to my network.
      It should highlight what the project does, why it's useful, and invite developers to check it out.
      Use a good hook, emojis, and relevant hashtags.
      ${languageInstruction}
      
      Output ONLY the post text, nothing else. No markdown wrappers.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text;
    
    res.json({
      repoName: repoData.name,
      owner: repoData.owner.login,
      stars: repoData.stargazers_count,
      generatedPost: text
    });

  } catch (error: any) {
    console.error("Demo Analyze Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate demo post" });
  }
});

export default router;

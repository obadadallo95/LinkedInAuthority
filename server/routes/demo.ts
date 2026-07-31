import express from "express";
import { fetchGithubContext } from "../services/github";
import { analyzeRepositoryAngles, generatePostFromAngle } from "../services/repositoryIntelligence";

const router = express.Router();

// In-memory Rate Limiter
// Limit: 3 analysis + 3 generations per IP per day
interface RateLimitData {
  analyzeCount: number;
  generateCount: number;
  lastReset: number;
}
const rateLimits = new Map<string, RateLimitData>();

function checkRateLimit(ip: string, type: 'analyze' | 'generate'): boolean {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { analyzeCount: 0, generateCount: 0, lastReset: now });
  }
  
  const data = rateLimits.get(ip)!;
  if (now - data.lastReset > ONE_DAY) {
    data.analyzeCount = 0;
    data.generateCount = 0;
    data.lastReset = now;
  }
  
  if (type === 'analyze' && data.analyzeCount >= 3) return false;
  if (type === 'generate' && data.generateCount >= 3) return false;
  
  return true;
}

function incrementRateLimit(ip: string, type: 'analyze' | 'generate') {
  const data = rateLimits.get(ip)!;
  if (type === 'analyze') data.analyzeCount++;
  if (type === 'generate') data.generateCount++;
}

router.post("/analyze", async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(ip, 'analyze')) {
      return res.status(429).json({ error: "Daily limit of 3 analyses reached. Please try again tomorrow." });
    }

    // Default intent to 'auto' if not provided for backwards compatibility or missing UI
    const { repoUrl, projectDescription, lang, intent = 'auto' } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    const ghContext = await fetchGithubContext(repoUrl);
    
    // Needs Context Check
    if (ghContext.hasWeakRepo && !projectDescription) {
      return res.json({ needsUserContext: true });
    }

    const result = await analyzeRepositoryAngles(repoUrl, ghContext, projectDescription, intent, lang);
    incrementRateLimit(ip, 'analyze');
    
    res.json(result);
  } catch (error: any) {
    console.error("Demo Analyze Error:", error);
    let errMsg = error.message || "Failed to analyze repository";
    if (typeof errMsg === 'string' && (errMsg.includes('503') || errMsg.includes('high demand'))) {
      errMsg = "The AI model is currently experiencing high demand. Please wait a moment and try again.";
    }
    res.status(500).json({ error: errMsg });
  }
});


router.post("/generate", async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(ip, 'generate')) {
      return res.status(429).json({ error: "Daily limit of 3 generations reached. Please try again tomorrow." });
    }

    const { repoUrl, projectDescription, angleId, humanContext, lang } = req.body;
    if (!repoUrl || !angleId) {
      return res.status(400).json({ error: "Repository URL and angleId are required" });
    }

    const ghContext = await fetchGithubContext(repoUrl);

    const result = await generatePostFromAngle(
      repoUrl, 
      ghContext, 
      projectDescription, 
      angleId, 
      humanContext, 
      lang
    );
    
    incrementRateLimit(ip, 'generate');
    
    res.json(result);
  } catch (error: any) {
    console.error("Demo Generate Error:", error);
    let errMsg = error.message || "Failed to generate post";
    if (typeof errMsg === 'string' && (errMsg.includes('503') || errMsg.includes('high demand'))) {
      errMsg = "The AI model is currently experiencing high demand. Please try again.";
    }
    res.status(500).json({ error: errMsg });
  }
});

export default router;

import express from "express";
import { fetchGithubContext } from "../services/github";
import { analyzeRepositoryAngles, generatePostFromAngle } from "../services/repositoryIntelligence";
import { signAnalysisToken, verifyAnalysisToken } from "../services/repositoryIntelligence/token";

const router = express.Router();

// In-memory Rate Limiter
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

    const { repoUrl, projectDescription, lang, intent } = req.body;
    
    // Strict Server-Side Validation
    if (!repoUrl || typeof repoUrl !== 'string' || !repoUrl.includes("github.com/")) {
      return res.status(400).json({ error: "Valid GitHub Repository URL is required" });
    }
    if (lang && !['ar', 'en', 'de'].includes(lang)) {
      return res.status(400).json({ error: "Unsupported language" });
    }
    if (projectDescription && projectDescription.length > 200) {
      return res.status(400).json({ error: "Project description exceeds 200 characters" });
    }

    const safeIntent = intent || 'auto';

    const ghContext = await fetchGithubContext(repoUrl);
    
    // Needs Context Check
    if (ghContext.hasWeakRepo && !projectDescription) {
      return res.json({ needsUserContext: true });
    }

    const result = await analyzeRepositoryAngles(repoUrl, ghContext, projectDescription, safeIntent, lang);
    incrementRateLimit(ip, 'analyze');
    
    // Generate Analysis Token
    const canonicalRepo = `github.com/${ghContext.repoData.owner.login.toLowerCase()}/${ghContext.repoData.name.toLowerCase()}`;
    const token = signAnalysisToken({
      version: 1,
      repository: canonicalRepo,
      lang: lang || 'en',
      intent: safeIntent,
      angles: result.angles,
      atomicFacts: result.atomicFacts,
      conflicts: result.conflicts,
      audience: "demo"
    });

    res.json({
      repository: result.repository,
      angles: result.angles,
      analysisToken: token
    });
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

    const { repoUrl, projectDescription, analysisToken, angleId, customAngle, humanContext, lang } = req.body;
    
    // Strict Server-Side Validation
    if (!repoUrl || typeof repoUrl !== 'string' || !repoUrl.includes("github.com/")) {
      return res.status(400).json({ error: "Valid GitHub Repository URL is required" });
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

    // Verify token
    const tokenPayload = verifyAnalysisToken(analysisToken);
    if (tokenPayload.audience !== 'demo') {
      return res.status(403).json({ error: "Invalid token audience." });
    }
    const ghContext = await fetchGithubContext(repoUrl);
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
    
    incrementRateLimit(ip, 'generate');
    
    res.json(result);
  } catch (error: any) {
    console.error("Demo Generate Error:", error);
    // Explicitly handle token verification errors as 401/403
    if (error.message.includes('token') || error.message.includes('signature')) {
      return res.status(403).json({ error: "Invalid or expired analysis session. Please analyze again." });
    }
    let errMsg = error.message || "Failed to generate post";
    if (typeof errMsg === 'string' && (errMsg.includes('503') || errMsg.includes('high demand'))) {
      errMsg = "The AI model is currently experiencing high demand. Please try again.";
    }
    res.status(500).json({ error: errMsg });
  }
});

export default router;

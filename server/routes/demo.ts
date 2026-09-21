import express from "express";
import { fetchGithubContext } from "../services/github";
import { handleGeminiError } from "../services/repositoryIntelligence/gemini";
import { analyzeRepositoryAngles, generatePostFromAngle } from "../services/repositoryIntelligence";
import { signAnalysisToken, verifyAnalysisToken } from "../services/repositoryIntelligence/token";

const router = express.Router();

import { rateLimitStore } from "../services/rateLimitStore";
import crypto from "crypto";

const SUPPORTED_LANGUAGES = ["ar", "en", "de"];
const SUPPORTED_INTENTS = ["auto", "project", "technical_decision", "challenge_lesson", "progress_update"];

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function parseGithubUrl(url: string): { owner: string, repo: string } | null {
  const match = url.match(/^https:\/\/github\.com\/([\w-]+)\/([\w.-]+?)(?:\.git|\/)?$/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function isBrowserE2eFixtureEnabled() {
  return process.env.E2E_BROWSER_TEST === 'true' && process.env.NODE_ENV !== 'production';
}

function isOptionalBoundedString(value: unknown, maxLength: number): boolean {
  return value === undefined || (typeof value === 'string' && value.length <= maxLength);
}

router.post("/analyze", async (req, res) => {
  try {
    const { repoUrl, projectDescription, lang, intent } = req.body;
    
    // Strict Server-Side Validation
    if (!repoUrl || typeof repoUrl !== 'string' || !parseGithubUrl(repoUrl)) {
      return res.status(400).json({ error: "Valid GitHub Repository URL is required (e.g. https://github.com/owner/repo)" });
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

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const hashedIp = hashIp(ip);
    const allowed = await rateLimitStore.checkAndIncrement(hashedIp, 'analyze', 3, 24 * 60 * 60 * 1000);
    if (!allowed) {
      return res.status(429).json({ error: "Daily limit of 3 analyses reached. Please try again tomorrow." });
    }

    if (isBrowserE2eFixtureEnabled()) {
      const parsed = parseGithubUrl(repoUrl)!;
      const fixtureAngle = {
        id: 'e2e-angle',
        intent: 'feature' as const,
        title: 'Verified repository progress',
        angleSummary: 'Fixture angle for browser E2E.',
        audience: 'developers' as const,
        audienceValue: 'Software engineers',
        evidenceIds: ['e2e-fact'],
        supportLevel: 'verified' as const,
        requiresHumanContext: false,
        recommended: true,
        tone: 'confident' as const,
        claimRisk: 'low' as const,
      };
      const token = signAnalysisToken({
        version: 1,
        repository: `github.com/${parsed.owner.toLowerCase()}/${parsed.repo.toLowerCase()}`,
        lang: lang || 'en',
        intent: safeIntent,
        angles: [fixtureAngle],
        atomicFacts: [{ id: 'e2e-fact', fact: 'The repository contains a documented browser-testable workflow.', source: 'e2e:fixture' }],
        conflicts: [],
        audience: 'demo'
      });
      return res.json({
        repository: { owner: parsed.owner, name: parsed.repo, description: 'Browser E2E fixture repository' },
        angles: [fixtureAngle],
        analysisToken: token
      });
    }

    const ghContext = await fetchGithubContext(repoUrl);
    
    // Needs Context Check
    if (ghContext.hasWeakRepo && !projectDescription) {
      return res.json({ needsUserContext: true });
    }

    const result = await analyzeRepositoryAngles(repoUrl, ghContext, projectDescription, safeIntent, lang, 'free');
    
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
    console.error("AI Analyze Error:", error instanceof Error ? error.name : "unknown");
    const errMsg = handleGeminiError(error, req.body.lang || 'en');
    res.status(500).json({ error: errMsg });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const { repoUrl, projectDescription, analysisToken, angleId, customAngle, humanContext, lang } = req.body;
    
    // Strict Server-Side Validation
    if (!repoUrl || typeof repoUrl !== 'string' || !parseGithubUrl(repoUrl)) {
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
    if (!isOptionalBoundedString(projectDescription, 200) || !isOptionalBoundedString(humanContext, 200)) {
      return res.status(400).json({ error: "Project description or human context exceeds 200 characters" });
    }
    if (!isOptionalBoundedString(customAngle, 200)) {
      return res.status(400).json({ error: "Custom angle exceeds 200 characters" });
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const hashedIp = hashIp(ip);
    const allowed = await rateLimitStore.checkAndIncrement(hashedIp, 'generate', 3, 24 * 60 * 60 * 1000);
    if (!allowed) {
      return res.status(429).json({ error: "Daily limit of 3 generations reached. Please try again tomorrow." });
    }

    if (isBrowserE2eFixtureEnabled()) {
      const tokenPayload = verifyAnalysisToken(analysisToken);
      if (tokenPayload.audience !== 'demo') return res.status(403).json({ error: "Invalid token audience." });
      return res.json({
        repository: { name: 'Browser E2E fixture repository' },
        evidence: [{ fact: 'The browser journey completed with a reviewable draft.', source: 'e2e:fixture' }],
        conflicts: [],
        post: 'A browser-verified draft: the workflow turns a repository signal into a reviewable technical story.',
        suggestedComment: 'Review the evidence before copying this draft to LinkedIn.'
      });
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
    if (lang && tokenPayload.lang !== lang) {
      return res.status(403).json({ error: "Language mismatch. Token was created for a different language." });
    }

    const result = await generatePostFromAngle(
      tokenPayload, 
      ghContext, 
      projectDescription, 
      angleId, 
      customAngle,
      humanContext, 
      lang,
      'free'
    );
    
    res.json(result);
  } catch (error: any) {
    console.error("Demo Generate Error:", error instanceof Error ? error.name : "unknown");
    // Explicitly handle token verification errors as 401/403
    if (error.message.includes('token') || error.message.includes('signature') || error.message.includes('Missing')) {
      return res.status(403).json({ error: "Invalid or expired analysis session. Please analyze again." });
    }
    if (error.message.includes('Custom angle contradicts') || error.message.includes('Generated post contains a blocking claim')) {
      return res.status(422).json({ error: error.message });
    }
    let errMsg = "Failed to generate post";
    const rawErrorMessage = error instanceof Error ? error.message : String(error || '');
    if (rawErrorMessage) {
      if (rawErrorMessage.includes('503') || rawErrorMessage.includes('high demand')) {
        errMsg = "The AI model is currently experiencing high demand. Please try again.";
      } else if (rawErrorMessage.includes('429') || rawErrorMessage.includes('Quota exceeded') || rawErrorMessage.includes('RESOURCE_EXHAUSTED')) {
        errMsg = req.body.lang === 'ar' 
          ? "تم تجاوز الحد المسموح للاستخدام المجاني للذكاء الاصطناعي حالياً. يرجى المحاولة مرة أخرى بعد قليل." 
          : "AI model free tier quota exceeded. Please try again in a moment.";
      }
    }
    res.status(500).json({ error: errMsg });
  }
});

export default router;

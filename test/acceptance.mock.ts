import { analyzeRepositoryAngles, generatePostFromAngle } from '../server/services/repositoryIntelligence/index.js';
import * as geminiModule from '../server/services/repositoryIntelligence/gemini.js';
import { AnalysisTokenPayload } from '../server/services/repositoryIntelligence/types.js';

// Mock Gemini Client
const mockGenerateContent = async (req: any) => {
  const reqStr = JSON.stringify(req);
  if (reqStr.includes('Perform your reasoning steps')) {
    return { response: { text: () => JSON.stringify({ 
      atomicFacts: [{ id: "f1", fact: "Mock fact", source: "readme" }],
      finalAngles: [{ id: "angle1", title: "Mock Angle", angleSummary: "Mock Summary", intent: "auto", audienceValue: "high", requiresHumanContext: true }] 
    }) } };
  }
  if (reqStr.includes('Generate a LinkedIn post')) {
    return { response: { text: () => JSON.stringify({ post: "This is a mock post.", usedEvidenceIds: ["f1"] }) } };
  }
  return { response: { text: () => "{}" } };
};

(geminiModule as any).getGeminiClient = () => ({
  models: {
    generateContent: mockGenerateContent
  }
});

async function runTests() {
  console.log("Starting Intelligence Engine V1 Acceptance Tests (Mocked)...\n");
  
  const mockGhContext = {
    owner: "test",
    repo: "test-repo",
    repoData: { name: "test-repo", description: "A test", owner: { login: "test" } },
    languages: { TypeScript: 100 },
    readmeText: "Mock Readme",
    manifestData: "",
    hasWeakRepo: false,
    commits: [{ message: "Initial commit", sha: "123", author: { date: new Date().toISOString() } }]
  };

  try {
    console.log("[1/3] Analyzing Repository Angles...");
    const analysisResult = await analyzeRepositoryAngles(
      "https://github.com/test/test-repo", 
      mockGhContext as any, 
      "", 
      "auto", 
      "en"
    );
    
    console.log(`✓ Generated ${analysisResult.angles?.length || 0} angles.`);
    
    if (!analysisResult.angles || analysisResult.angles.length === 0) {
      console.error("❌ Test Failed: No angles generated.");
      return;
    }
    
    const selectedAngle = analysisResult.angles[0];
    console.log(`\n[2/3] Generating Post for Angle: ${selectedAngle.title}...`);
    
    const tokenPayload: AnalysisTokenPayload = {
      version: 1,
      repository: "https://github.com/test/test-repo",
      lang: "en",
      intent: "auto",
      angles: analysisResult.angles,
      atomicFacts: analysisResult.atomicFacts,
      conflicts: analysisResult.conflicts,
      audience: "demo",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };

    const generateResult = await generatePostFromAngle(
      tokenPayload,
      mockGhContext as any,
      "",
      selectedAngle.id,
      undefined,
      "Because testing is good.",
      "en"
    );
    
    console.log(`✓ Post Generated Successfully: "${generateResult.post}"`);
    console.log(`✓ Used ${generateResult.evidence?.length || 0} evidence points.`);
    
    console.log("\n[3/3] Validation Passed for this repository.\n");
    
  } catch (e: any) {
    console.error(`❌ Test Failed: ${e.stack}`);
  }
}

runTests();

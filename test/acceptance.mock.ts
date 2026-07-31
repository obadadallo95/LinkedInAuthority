import { analyzeRepositoryAngles, generatePostFromAngle } from '../server/services/repositoryIntelligence/index.js';
import * as geminiModule from '../server/services/repositoryIntelligence/gemini.js';
import { analysisCache } from '../server/services/repositoryIntelligence/cache.js';

// Mock Gemini Client
const mockGenerateContent = async (req: any) => {
  const reqStr = JSON.stringify(req);
  if (reqStr.includes('Extract maximum 5 unique Atomic Facts')) {
    return { response: { text: () => JSON.stringify({ facts: [{ fact: "Mock fact", confidence: "high", source: "readme" }] }) } };
  }
  if (reqStr.includes('Group the following Atomic Facts')) {
    return { response: { text: () => JSON.stringify({ clusters: [{ theme: "Mock theme", facts: ["Mock fact"] }] }) } };
  }
  if (reqStr.includes('Generate candidate narrative angles')) {
    return { response: { text: () => JSON.stringify({ angles: [{ id: "angle1", title: "Mock Angle", summary: "Mock Summary", intentMatch: "auto", professionalValue: "high", requiresHumanContext: true, adaptiveQuestion: "Why?" }] }) } };
  }
  if (reqStr.includes('Identify any exaggerated')) {
    return { response: { text: () => JSON.stringify({ conflicts: [] }) } };
  }
  if (reqStr.includes('Generate a LinkedIn post')) {
    return { response: { text: () => JSON.stringify({ post: "This is a mock post." }) } };
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
    repoData: { name: "test-repo", description: "A test" },
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
    
    // The angle is cached in analysisCache
    const generateResult = await generatePostFromAngle(
      "https://github.com/test/test-repo",
      mockGhContext as any,
      "",
      selectedAngle.id,
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

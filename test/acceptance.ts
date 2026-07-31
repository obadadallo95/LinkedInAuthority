import { analyzeRepositoryAngles, generatePostFromAngle } from '../server/services/repositoryIntelligence/index.js';
import { fetchGithubContext } from '../server/services/github.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const REPOS = [
  'https://github.com/facebook/react',
  'https://github.com/expressjs/express',
];

async function runTests() {
  console.log("Starting Intelligence Engine V1 Acceptance Tests...\n");
  
  for (const repoUrl of REPOS) {
    console.log(`\n========================================`);
    console.log(`Testing Repository: ${repoUrl}`);
    console.log(`========================================\n`);
    
    try {
      console.log("[1/4] Fetching GitHub Context...");
      const ghContext = await fetchGithubContext(repoUrl, process.env.GITHUB_TOKEN);
      console.log(`✓ Fetched ${ghContext.commits.length} commits and README (${ghContext.readme.length} chars)`);
      
      console.log("\n[2/4] Analyzing Repository Angles...");
      const analysisResult = await analyzeRepositoryAngles(
        repoUrl, 
        ghContext, 
        "", 
        "auto", 
        "en"
      );
      
      console.log(`✓ Generated ${analysisResult.angles?.length || 0} angles.`);
      if (analysisResult.conflicts?.length > 0) {
        console.log(`⚠ Found ${analysisResult.conflicts.length} conflicts.`);
      }
      
      analysisResult.angles?.forEach((angle: any, i: number) => {
        console.log(`\n  Angle ${i+1}: ${angle.title}`);
        console.log(`  Summary: ${angle.summary}`);
        console.log(`  Requires Context: ${angle.requiresHumanContext}`);
      });
      
      if (!analysisResult.angles || analysisResult.angles.length === 0) {
        console.error("❌ Test Failed: No angles generated.");
        continue;
      }
      
      const selectedAngle = analysisResult.angles[0];
      
      console.log(`\n[3/4] Generating Post for Angle: ${selectedAngle.title}...`);
      const humanContext = selectedAngle.requiresHumanContext ? "We focused on performance." : "";
      
      const generateResult = await generatePostFromAngle(
        repoUrl,
        ghContext,
        "",
        selectedAngle.id,
        humanContext,
        "en"
      );
      
      console.log(`✓ Post Generated Successfully (${generateResult.post.length} chars)`);
      console.log(`✓ Used ${generateResult.evidence?.length || 0} evidence points.`);
      
      console.log("\n[4/4] Validation Passed for this repository.\n");
      
    } catch (e: any) {
      console.error(`❌ Test Failed for ${repoUrl}: ${e.message}`);
    }
  }
  
  console.log("Tests Completed.");
}

runTests();

import { getGeminiClient, callGeminiWithRetry } from '../repositoryIntelligence/gemini';
import { SynthesizedContext } from './synthesizer';
import { getGenerateLanguageInstruction } from '../repositoryIntelligence/prompts';

export interface DeepGeneratedPost {
  post: string;
  suggestedComment: string;
}

const deepPostSchema = {
  type: "OBJECT",
  properties: {
    post: {
      type: "STRING",
      description: "The complete, highly professional LinkedIn post."
    },
    suggestedComment: {
      type: "STRING",
      description: "A professional comment to be placed under the post containing the link to the GitHub repository, avoiding putting links in the main post to bypass LinkedIn algorithm penalties."
    }
  },
  required: ["post", "suggestedComment"]
};

export async function generateDeepPost(
  synthesizedContext: SynthesizedContext,
  repoUrl: string,
  lang: string
): Promise<DeepGeneratedPost> {
  const client = getGeminiClient('pro');
  if (!client) {
    throw new Error("Gemini API client is not configured.");
  }

  const langInstruction = getGenerateLanguageInstruction(lang);

  const prompt = `You are an elite, highly professional Developer Advocate and Tech Lead.
Your goal is to write an exceptional, viral-worthy LinkedIn post based on deep repository intelligence.

CONTEXT ABOUT THE REPOSITORY:
- Technical Decisions:
${synthesizedContext.technicalDecisions.map(d => `  * ${d}`).join('\n')}
- Challenges Solved:
${synthesizedContext.challengesSolved.map(c => `  * ${c}`).join('\n')}
- New Features:
${synthesizedContext.newFeatures.map(f => `  * ${f}`).join('\n')}

Summary:
${synthesizedContext.summary}

LINK TO REPOSITORY:
${repoUrl}

INSTRUCTIONS:
1. Write a compelling, highly professional LinkedIn post that highlights the engineering work done.
2. The post MUST NOT sound like a generic AI output. Avoid clichés like "I'm thrilled to announce" or excessive emojis. Start with a strong hook about the problem being solved or the architecture.
3. Keep sentences punchy, use formatting (line breaks), and make it highly readable.
4. DO NOT put the GitHub repository link in the main post.
5. Create a \`suggestedComment\` that contains the link to the repository (${repoUrl}) in a professional way (e.g. "If you want to dive into the code or contribute, here is the repository: [link]").

${langInstruction}`;

  const model = "gemini-2.5-flash"; // Fast, reliable generation

  try {
    const response = await callGeminiWithRetry(
      client, 
      prompt, 
      "You are an elite Tech Lead and Developer Advocate.", 
      deepPostSchema as any,
      model
    );
    return response as DeepGeneratedPost;
  } catch (error: any) {
    console.error("Error generating deep post:", error);
    throw new Error("Failed to generate deep post: " + error.message);
  }
}

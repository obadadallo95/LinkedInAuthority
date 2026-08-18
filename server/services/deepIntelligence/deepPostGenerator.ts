import { getGeminiClient, callGeminiWithRetry } from '../repositoryIntelligence/gemini';
import { SynthesizedContext } from './synthesizer';
import { getGenerateLanguageInstruction } from '../repositoryIntelligence/prompts';

export interface DeepGeneratedPost {
  post: string;
  suggestedComment: string;
}

export interface DeepPostOptions {
  intent?: 'weekly_progress' | 'technical_deep_dive' | string;
  targetAudience?: 'tech_community' | 'recruiters' | 'beginners' | string;
  repoIdentity?: {
    name: string;
    description: string;
  };
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

function getIntentGuidance(intent: string = 'weekly_progress'): string {
  if (intent === 'technical_deep_dive') {
    return `CONTENT STRATEGY: TECHNICAL DEEP DIVE
- Select ONE specific, meaningful architectural choice, bug resolution, or technical challenge from the context.
- Structure:
  1. The Technical Challenge or Dilemma (Show the engineering problem vividly).
  2. The Trade-offs (Why approach A was chosen over approach B).
  3. The Implementation & Solution (How it was solved in this codebase).
  4. The Takeaway (Ask the audience for their thoughts on this architectural pattern).
- Do NOT make a generic bullet-point list of features. Go deep on one concrete engineering story.`;
  }

  // Default: weekly_progress
  return `CONTENT STRATEGY: WEEKLY PROGRESS UPDATE
- Structure:
  1. Strong Hook: Highlight this week's development momentum or the major problem addressed.
  2. What Shipped / Changed: Highlight 2-3 key progress items (features, fixes, or refactors) clearly with bullet points.
  3. Impact / What's Next: Share the immediate benefit to users or developers, and tease upcoming work.
  4. Call to Action: Invite the community to check the progress or give feedback.
- Keep it concise, high-momentum, and focused on shipping.`;
}

function getAudienceGuidance(audience: string = 'tech_community'): string {
  if (audience === 'recruiters') {
    return `TARGET AUDIENCE: HIRING MANAGERS & RECRUITERS
- Frame the engineering work to showcase technical ownership, problem-solving ability, production readiness, and shipping velocity.
- Emphasize business and developer impact rather than hyper-obscure compiler arcana.`;
  }
  if (audience === 'beginners') {
    return `TARGET AUDIENCE: JUNIOR DEVELOPERS & LEARNERS
- Explain technical concepts clearly without heavy jargon.
- Use intuitive analogies where helpful.
- Focus on the learning journey and takeaways that any developer can benefit from.`;
  }

  // Default: tech_community
  return `TARGET AUDIENCE: EXPERIENCED SOFTWARE ENGINEERS & PEERS
- Speak engineer-to-engineer with sharp technical clarity, authentic vocabulary, and architectural precision.
- Focus on practical decisions, performance, DX, and clean engineering trade-offs.`;
}

export async function generateDeepPost(
  synthesizedContext: SynthesizedContext,
  repoUrl: string,
  lang: string,
  options?: DeepPostOptions
): Promise<DeepGeneratedPost> {
  const client = getGeminiClient('pro');
  if (!client) {
    throw new Error("Gemini API client is not configured.");
  }

  if (synthesizedContext.hasMeaningfulContent === false) {
    throw new Error("Insufficient evidence to generate a meaningful engineering post.");
  }

  const langInstruction = getGenerateLanguageInstruction(lang);
  const intentGuidance = getIntentGuidance(options?.intent);
  const audienceGuidance = getAudienceGuidance(options?.targetAudience);

  const prompt = `You are an elite Tech Lead, Developer Advocate, and LinkedIn Ghostwriter.
Write an authentic, high-impact LinkedIn post based strictly on this verified repository intelligence.

REPOSITORY IDENTITY:
- Name: ${options?.repoIdentity?.name || 'Repository'}
- Purpose: ${options?.repoIdentity?.description || 'Software Project'}
- URL: ${repoUrl}

SYNTHESIZED ENGINEERING DELTAS:
- Technical Decisions:
${(synthesizedContext.technicalDecisions || []).map(d => `  * ${d}`).join('\n') || '  * None'}
- Challenges Solved:
${(synthesizedContext.challengesSolved || []).map(c => `  * ${c}`).join('\n') || '  * None'}
- New Features / Improvements:
${(synthesizedContext.newFeatures || []).map(f => `  * ${f}`).join('\n') || '  * None'}
- Summary:
${synthesizedContext.summary || 'Recent development updates.'}

${intentGuidance}

${audienceGuidance}

CRITICAL RULES:
1. Grounding: The post MUST strictly represent the repository's true purpose (${options?.repoIdentity?.name || 'the project'}) and only claim work actually evidenced in the context.
2. Hook: Start with a punchy, realistic hook (no "I am excited to announce" or generic cliché fluff).
3. No URLs in the main post body (LinkedIn penalty). Put the link exclusively in the suggestedComment.
4. Suggested Comment: Create a natural first comment with ${repoUrl}.
5. Formatting: Use single-sentence paragraphs, clean spacing, and bullet points where listing features.

${langInstruction}`;

  const model = "gemini-3.6-flash";

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

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
  const norm = (intent || '').toLowerCase();
  
  if (norm.includes('project') || norm.includes('launch') || norm.includes('announc') || norm.includes('مشروع') || norm.includes('انطلاق') || norm.includes('أعلن')) {
    return `CONTENT STRATEGY: PROJECT LAUNCH / PRODUCT ANNOUNCEMENT
- Goal: Introduce the project and explain its core value proposition clearly.
- Structure:
  1. The Problem / Frustration: What common annoyance, friction, or unmet need inspired creating this?
  2. The Solution: Introduce the product by name and describe what it does in human, accessible terms.
  3. Key Value & Features: Highlight 2-3 standout benefits for the user (e.g. privacy, native UX, zero configuration, speed).
  4. Call to Action: Invite the audience to check it out, give feedback, or try it.
- Tone: Welcoming, proud, user-focused, and inspiring. Do NOT write an internal changelog; focus on the product's purpose and experience.`;
  }

  if (norm === 'technical_deep_dive' || norm.includes('technical') || norm.includes('decision') || norm.includes('قرار')) {
    return `CONTENT STRATEGY: TECHNICAL DEEP DIVE
- Select ONE specific, meaningful architectural choice, bug resolution, or technical challenge from the context.
- Structure:
  1. The Technical Challenge or Dilemma (Show the engineering problem vividly).
  2. The Trade-offs (Why approach A was chosen over approach B).
  3. The Implementation & Solution (How it was solved in this codebase).
  4. The Takeaway (Ask the audience for their thoughts on this architectural pattern).
- Do NOT make a generic bullet-point list of features. Go deep on one concrete engineering story.`;
  }

  if (norm.includes('challenge') || norm.includes('lesson') || norm.includes('تحدي') || norm.includes('درس')) {
    return `CONTENT STRATEGY: CHALLENGE & LESSON LEARNED
- Focus on an obstacle or friction encountered during development and what was learned from overcoming it.
- Structure:
  1. The unexpected roadblock or complexity.
  2. How it was diagnosed and solved.
  3. The core lesson that others can apply in their own projects.`;
  }

  // Default: weekly_progress / progress_update
  return `CONTENT STRATEGY: WEEKLY PROGRESS UPDATE
- Structure:
  1. Strong Hook: Highlight this week's development momentum or the major problem addressed.
  2. What Shipped / Changed: Highlight 2-3 key progress items (features, fixes, or refactors) clearly with bullet points.
  3. Impact / What's Next: Share the immediate benefit to users or developers, and tease upcoming work.
  4. Call to Action: Invite the community to check the progress or give feedback.
- Keep it concise, high-momentum, and focused on shipping.`;
}

function getAudienceGuidance(audience: string = 'tech_community'): string {
  const norm = (audience || '').toLowerCase();

  if (norm.includes('general') || norm.includes('public') || norm.includes('beginner') || norm.includes('عام') || norm.includes('الجمهور')) {
    return `TARGET AUDIENCE: GENERAL PUBLIC & BROAD AUDIENCE
- Write in clear, relatable, human language that ANY computer/Mac user or professional can easily understand.
- STRICT RULE: AVOID obscure internal programming jargon (e.g. do NOT talk about "semaphore bridges", "MainActor", "NSServices", or "mutex race conditions" unless explained simply as "making the app ultra-fast, smooth, and crash-free").
- Focus on the practical everyday problem solved, time saved, ease of use, design elegance, and user privacy.`;
  }

  if (norm.includes('recruiter') || norm.includes('hr') || norm.includes('توظيف') || norm.includes('موارد')) {
    return `TARGET AUDIENCE: HIRING MANAGERS & RECRUITERS
- Frame the engineering work to showcase technical ownership, problem-solving ability, production readiness, and shipping velocity.
- Emphasize business and developer impact rather than hyper-obscure compiler arcana.`;
  }

  if (norm.includes('cto') || norm.includes('lead') || norm.includes('مدراء')) {
    return `TARGET AUDIENCE: CTOs, TECH LEADS & ENGINEERING LEADERSHIP
- Focus on architectural scalability, maintainability, engineering trade-offs, and technical strategy.`;
  }

  // Default: tech_community / software engineers
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

  try {
    const response = await callGeminiWithRetry(
      client, 
      prompt, 
      "You are an elite Tech Lead and Developer Advocate.", 
      deepPostSchema as any,
      {
        task: 'deep_post_generation',
        telemetryContext: {
          feature: 'deep_post_generation',
          repository: options?.repoIdentity?.name
        }
      }
    );
    return response as DeepGeneratedPost;
  } catch (error: any) {
    console.error("Error generating deep post:", error);
    throw new Error("Failed to generate deep post: " + error.message);
  }
}

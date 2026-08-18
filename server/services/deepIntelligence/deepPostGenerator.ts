import { getGeminiClient, callGeminiWithRetry } from '../repositoryIntelligence/gemini';
import { SynthesizedContext, ProductProfile } from './synthesizer';
import { getGenerateLanguageInstruction } from '../repositoryIntelligence/prompts';
import { VerifiedLink, VerifiedLinkType } from './linkExtractor';

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

export interface SelectedCTA {
  type: VerifiedLinkType;
  url: string;
  label?: string;
  context: string;
}

export function selectCallToAction(
  productProfile?: ProductProfile,
  intent?: string,
  audience?: string,
  repoUrl?: string
): SelectedCTA {
  const fallbackUrl = repoUrl || 'https://github.com';
  const defaultCta: SelectedCTA = {
    type: 'github_repo',
    url: fallbackUrl,
    label: 'GitHub Repository',
    context: 'Source code and project repository'
  };

  if (!productProfile) {
    return defaultCta;
  }

  const links: VerifiedLink[] = productProfile.verifiedLinks || [];
  const homepage = links.find(l => l.type === 'homepage') || (productProfile.homepageUrl ? { type: 'homepage' as VerifiedLinkType, url: productProfile.homepageUrl, label: 'Official Website' } : undefined);
  const webApp = links.find(l => l.type === 'web_app');
  const macStore = links.find(l => l.type === 'mac_app_store');
  const msStore = links.find(l => l.type === 'microsoft_store');
  const chromeStore = links.find(l => l.type === 'chrome_web_store');
  const appStore = links.find(l => l.type === 'app_store');
  const playStore = links.find(l => l.type === 'google_play');
  const storeLink = macStore || msStore || chromeStore || appStore || playStore;
  const releasesLink = links.find(l => l.type === 'github_releases');
  const repoLink = links.find(l => l.type === 'github_repo') || defaultCta;

  const normIntent = (intent || '').toLowerCase();
  const normAudience = (audience || '').toLowerCase();

  const isLaunch = normIntent.includes('project') || normIntent.includes('launch') || normIntent.includes('announc') || normIntent.includes('مشروع') || normIntent.includes('انطلاق') || normIntent.includes('أعلن');
  const isGeneralPublic = normAudience.includes('general') || normAudience.includes('public') || normAudience.includes('beginner') || normAudience.includes('عام') || normAudience.includes('الجمهور');
  const isRecruiter = normAudience.includes('recruiter') || normAudience.includes('hr') || normAudience.includes('توظيف');

  if (isLaunch) {
    if (isGeneralPublic) {
      // General Public Priority: 1. Official Homepage -> 2. Web App -> 3. Official Store -> 4. GitHub
      if (homepage) return { type: homepage.type, url: homepage.url, label: homepage.label || 'Official Website', context: 'Official product website / landing page' };
      if (webApp) return { type: webApp.type, url: webApp.url, label: webApp.label || 'Web App', context: 'Live web app' };
      if (storeLink) return { type: storeLink.type, url: storeLink.url, label: storeLink.label || 'App Store', context: 'Official store download' };
      return { type: repoLink.type, url: repoLink.url, label: repoLink.label || 'Project Repository', context: 'GitHub repository' };
    }

    if (isRecruiter) {
      // Recruiter Priority: 1. Official Homepage / Web App -> 2. GitHub
      if (homepage) return { type: homepage.type, url: homepage.url, label: homepage.label || 'Product Demo / Homepage', context: 'Official product website' };
      if (webApp) return { type: webApp.type, url: webApp.url, label: webApp.label || 'Live App', context: 'Live web app' };
      return { type: repoLink.type, url: repoLink.url, label: repoLink.label || 'GitHub Repository', context: 'GitHub repository' };
    }

    // Technical Audience / Software Engineers
    // If Homepage exists, prefer Homepage; otherwise GitHub Repo
    if (homepage) return { type: homepage.type, url: homepage.url, label: homepage.label || 'Official Website', context: 'Official product homepage' };
    return { type: repoLink.type, url: repoLink.url, label: repoLink.label || 'GitHub Repository', context: 'GitHub repository' };
  }

  // Progress Update / Technical Decisions / Challenges
  if (releasesLink) {
    return { type: releasesLink.type, url: releasesLink.url, label: 'Release Notes', context: 'GitHub release notes' };
  }
  return { type: repoLink.type, url: repoLink.url, label: repoLink.label || 'GitHub Repository', context: 'GitHub repository' };
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
      description: "A natural first comment placed under the post containing the exact verified Call-to-Action URL, avoiding putting links in the main post to bypass LinkedIn algorithm penalties."
    }
  },
  required: ["post", "suggestedComment"]
};

function getIntentGuidance(intent: string = 'weekly_progress'): string {
  const norm = (intent || '').toLowerCase();
  
  if (norm.includes('project') || norm.includes('launch') || norm.includes('announc') || norm.includes('مشروع') || norm.includes('انطلاق') || norm.includes('أعلن')) {
    return `CONTENT STRATEGY: PROJECT LAUNCH / PRODUCT ANNOUNCEMENT
- Goal: Tell the authentic story of this product, why it was created, and invite the audience to try it.
- Grounding:
  1. The Everyday Problem: Paint a clear, relatable picture of the friction or frustration users faced.
  2. The Solution: Introduce the product naturally by name and explain what it does in human terms.
  3. Key Value & Proof Points: Highlight 2-3 genuine differentiators supported by verified evidence (e.g. privacy, native speed, multi-platform availability, store releases).
  4. Call to Action: Invite the audience to check out the verified product destination.
- Anti-Cliché Rule: Do NOT write a formulaic or robotic bulleted list. Structure the story naturally and dynamically to fit the product's true voice.`;
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

  const profile = synthesizedContext.productProfile;
  const selectedCta = selectCallToAction(profile, options?.intent, options?.targetAudience, repoUrl);

  const normIntent = (options?.intent || '').toLowerCase();
  const isLaunch = normIntent.includes('project') || normIntent.includes('launch') || normIntent.includes('announc') || normIntent.includes('مشروع') || normIntent.includes('انطلاق') || normIntent.includes('أعلن');

  let evidencePromptSection = "";

  if (isLaunch && profile) {
    evidencePromptSection = `PRIMARY CONTEXT (VERIFIED PRODUCT PROFILE):
- Product Name: ${profile.name}
- Purpose: ${profile.oneSentencePurpose || options?.repoIdentity?.description || 'Software Application'}
- Everyday Problem Solved: ${profile.problemSolved || 'Not specified'}
- Target Users: ${profile.targetUsers.length > 0 ? profile.targetUsers.join(', ') : 'General users and professionals'}
- Documented Platforms: ${profile.platforms.length > 0 ? profile.platforms.join(', ') : 'Not specified'}
- Documented Distribution Channels: ${profile.distributionChannels.length > 0 ? profile.distributionChannels.join(', ') : 'Not specified'}
- Privacy & Offline Guarantees: ${profile.privacyCharacteristics.length > 0 ? profile.privacyCharacteristics.join(', ') : 'Not specified'}
- Primary Benefits: ${profile.primaryBenefits.length > 0 ? profile.primaryBenefits.join(', ') : 'Not specified'}
- Major Documented Capabilities:
${profile.majorCapabilities.length > 0 ? profile.majorCapabilities.map(c => `  * ${c}`).join('\n') : '  * Documented in repository'}
- Release Status / Milestone: ${profile.releaseStatus || 'Available Now'}

SECONDARY CONTEXT (RECENT ACTIVITY MOMENTUM):
- Recent Summary: ${synthesizedContext.summary || 'Initial launch'}
- Notable Improvements: ${(synthesizedContext.newFeatures || []).slice(0, 3).map(f => `  * ${f}`).join('\n') || '  * Initial release'}`;
  } else {
    evidencePromptSection = `PRIMARY CONTEXT (SYNTHESIZED ENGINEERING DELTAS):
- Technical Decisions:
${(synthesizedContext.technicalDecisions || []).map(d => `  * ${d}`).join('\n') || '  * None'}
- Challenges Solved:
${(synthesizedContext.challengesSolved || []).map(c => `  * ${c}`).join('\n') || '  * None'}
- New Features / Improvements:
${(synthesizedContext.newFeatures || []).map(f => `  * ${f}`).join('\n') || '  * None'}
- Summary:
${synthesizedContext.summary || 'Recent development updates.'}

SECONDARY CONTEXT (PRODUCT IDENTITY):
- Name: ${profile?.name || options?.repoIdentity?.name || 'Repository'}
- Purpose: ${profile?.oneSentencePurpose || options?.repoIdentity?.description || 'Software Project'}`;
  }

  const prompt = `You are an elite Tech Lead, Product Storyteller, and LinkedIn Ghostwriter.
Write an authentic, compelling LinkedIn post based strictly on this verified product & engineering intelligence.

${evidencePromptSection}

VERIFIED CALL TO ACTION (CTA):
- CTA Destination Type: ${selectedCta.type}
- EXACT CTA URL: ${selectedCta.url}
- CTA Label / Description: ${selectedCta.label || selectedCta.context}

${intentGuidance}

${audienceGuidance}

CRITICAL RULES:
1. Grounding: The post MUST strictly represent the verified reality of the product (${profile?.name || options?.repoIdentity?.name || 'the project'}). Do NOT hallucinate unsupported capabilities or metrics.
2. Narrative Quality: Craft a natural, high-impact founder/creator post. Avoid generic filler clichés and rigid template formatting.
3. No URLs in the main post body (LinkedIn algorithm penalty).
4. Suggested Comment: Write an engaging, natural first comment that seamlessly shares the EXACT verified URL: ${selectedCta.url}.
   STRICT REQUIREMENT: Use the EXACT URL provided above (${selectedCta.url}). Do NOT change, shorten, reconstruct, or replace this URL with a different domain.
5. Formatting: Clean paragraph spacing, readable structure, and concise sentences.

${langInstruction}`;

  try {
    const response = await callGeminiWithRetry(
      client, 
      prompt, 
      "You are an elite Tech Lead and Product Storyteller.", 
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


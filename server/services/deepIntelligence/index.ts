import { 
  fetchDeepGithubContext, 
  GroundedDeepGithubContext, 
  fetchLatestCommit, 
  LatestCommitInfo,
  checkRepositoryActivityDelta,
  ActivityCheckOptions,
  ActivityCheckpoint,
  ActivityDeltaResult,
  VerifiedLink,
  VerifiedLinkType,
  extractVerifiedLinks,
  classifyUrl
} from './githubDeepFetcher';
import { synthesizeDeepContext, SynthesizedContext, ProductProfile } from './synthesizer';
import { generateDeepPost, DeepGeneratedPost, DeepPostOptions, selectCallToAction, SelectedCTA } from './deepPostGenerator';
import { UserTier } from '../entitlements';

export { 
  fetchLatestCommit,
  checkRepositoryActivityDelta,
  fetchDeepGithubContext,
  synthesizeDeepContext,
  generateDeepPost,
  extractVerifiedLinks,
  classifyUrl,
  selectCallToAction
};

export type { 
  LatestCommitInfo,
  ActivityCheckOptions,
  ActivityCheckpoint,
  ActivityDeltaResult,
  GroundedDeepGithubContext,
  SynthesizedContext,
  ProductProfile,
  VerifiedLink,
  VerifiedLinkType,
  DeepGeneratedPost,
  DeepPostOptions,
  SelectedCTA
};

export interface DeepScanResult {
  githubContext: GroundedDeepGithubContext;
  synthesizedContext: SynthesizedContext;
}

export async function performDeepScan(
  repoUrl: string, 
  token?: string,
  options?: ActivityCheckOptions,
  tier: UserTier = 'free'
): Promise<DeepScanResult> {
  // 1. Fetch Grounded Context (Identity + Monitored Streams)
  const githubContext = await fetchDeepGithubContext(repoUrl, token, options);

  // 2. Synthesize Grounded Context using AI
  const synthesizedContext = await synthesizeDeepContext(githubContext, tier);

  return {
    githubContext,
    synthesizedContext
  };
}

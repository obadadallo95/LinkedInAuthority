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
  RepositoryMap,
  PreviousRepositorySnapshot,
  extractVerifiedLinks,
  classifyUrl
} from './githubDeepFetcher';
import { synthesizeDeepContext, SynthesizedContext, ProductProfile } from './synthesizer';
import { generateDeepPost, DeepGeneratedPost, DeepPostOptions, selectCallToAction, SelectedCTA } from './deepPostGenerator';
import { ClaimAudit, EvidenceItem } from './claimAudit';
import { UserTier } from '../entitlements';
import { TelemetryContext } from '../repositoryIntelligence/modelRouting';

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
  RepositoryMap,
  PreviousRepositorySnapshot,
  DeepGeneratedPost,
  DeepPostOptions,
  SelectedCTA,
  ClaimAudit,
  EvidenceItem
};

export interface DeepScanResult {
  githubContext: GroundedDeepGithubContext;
  synthesizedContext: SynthesizedContext;
}

export async function performDeepScan(
  repoUrl: string, 
  token?: string,
  options?: ActivityCheckOptions,
  tier: UserTier = 'free',
  previousSnapshot?: PreviousRepositorySnapshot,
  telemetryContext?: TelemetryContext,
): Promise<DeepScanResult> {
  // 1. Fetch Grounded Context (Identity + Monitored Streams)
  const githubContext = await fetchDeepGithubContext(repoUrl, token, options, previousSnapshot);

  // 2. Synthesize Grounded Context using AI
  const synthesizedContext = await synthesizeDeepContext(githubContext, tier, telemetryContext);

  return {
    githubContext,
    synthesizedContext
  };
}

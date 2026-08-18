import { 
  fetchDeepGithubContext, 
  GroundedDeepGithubContext, 
  fetchLatestCommit, 
  LatestCommitInfo,
  checkRepositoryActivityDelta,
  ActivityCheckOptions,
  ActivityCheckpoint,
  ActivityDeltaResult
} from './githubDeepFetcher';
import { synthesizeDeepContext, SynthesizedContext } from './synthesizer';
import { generateDeepPost, DeepGeneratedPost, DeepPostOptions } from './deepPostGenerator';

export { 
  fetchLatestCommit,
  checkRepositoryActivityDelta,
  fetchDeepGithubContext,
  synthesizeDeepContext,
  generateDeepPost
};

export type { 
  LatestCommitInfo,
  ActivityCheckOptions,
  ActivityCheckpoint,
  ActivityDeltaResult,
  GroundedDeepGithubContext,
  SynthesizedContext,
  DeepGeneratedPost,
  DeepPostOptions
};

export interface DeepScanResult {
  githubContext: GroundedDeepGithubContext;
  synthesizedContext: SynthesizedContext;
}

export async function performDeepScan(
  repoUrl: string, 
  token?: string,
  options?: ActivityCheckOptions
): Promise<DeepScanResult> {
  // 1. Fetch Grounded Context (Identity + Monitored Streams)
  const githubContext = await fetchDeepGithubContext(repoUrl, token, options);

  // 2. Synthesize Grounded Context using AI
  const synthesizedContext = await synthesizeDeepContext(githubContext);

  return {
    githubContext,
    synthesizedContext
  };
}

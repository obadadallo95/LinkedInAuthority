import { fetchDeepGithubContext, DeepGithubContext } from './githubDeepFetcher';
import { synthesizeDeepContext, SynthesizedContext } from './synthesizer';

export interface DeepScanResult {
  githubContext: DeepGithubContext;
  synthesizedContext: SynthesizedContext;
}

export async function performDeepScan(repoUrl: string, token?: string): Promise<DeepScanResult> {
  // 1. Fetch Deep Context
  const githubContext = await fetchDeepGithubContext(repoUrl, token);

  // 2. Synthesize Context using AI
  const synthesizedContext = await synthesizeDeepContext(githubContext);

  return {
    githubContext,
    synthesizedContext
  };
}

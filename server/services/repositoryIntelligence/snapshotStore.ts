import crypto from 'node:crypto';
import { getAdminFirestore } from '../firestoreAdmin';
import { GroundedDeepGithubContext } from '../deepIntelligence/githubDeepFetcher';
import type { SynthesizedContext } from '../deepIntelligence/synthesizer';

function hash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export interface RepositorySnapshotReference {
  analyzedCommitSha: string;
  defaultBranch: string;
  selectedFiles?: Array<{ path: string; content: string; source?: string }>;
}

export function buildRepositorySnapshot(
  context: GroundedDeepGithubContext,
  synthesizedContext?: SynthesizedContext,
  indexedAt = new Date().toISOString(),
) {
  const map = context.repositoryMap;
  if (!map) return undefined;

  const evidenceReferences = (synthesizedContext?.evidence || []).map(evidence => ({
    id: evidence.id,
    sourceType: evidence.sourceType,
    reference: evidence.reference,
  }));

  return {
    repository: `github.com/${context.owner}/${context.repo}`,
    owner: context.owner,
    repo: context.repo,
    analyzedCommitSha: map.analyzedCommitSha,
    defaultBranch: map.defaultBranch,
    tree: map.tree,
    importantDirectories: map.importantDirectories,
    manifests: map.manifests,
    frameworkConfigFiles: map.frameworkConfigFiles,
    architectureDocs: map.architectureDocs,
    testFiles: map.testFiles,
    applicationEntryPoints: map.applicationEntryPoints,
    importantDomainFiles: map.importantDomainFiles,
    recentChangedFiles: map.recentChangedFiles,
    selectedFiles: map.selectedFiles.map(file => ({
      path: file.path,
      source: file.source,
      contentHash: hash(file.content),
      content: file.content,
    })),
    detectedStack: Object.keys(context.repoIdentity.languages || {}),
    repositoryIdentity: {
      name: context.repoIdentity.name,
      description: context.repoIdentity.description,
      homepageUrl: context.repoIdentity.homepageUrl || null,
      topics: context.repoIdentity.topics,
    },
    architectureSummary: synthesizedContext?.summary || null,
    majorModules: map.importantDirectories,
    majorFeatures: synthesizedContext?.newFeatures || [],
    verifiedProductCapabilities: synthesizedContext?.productProfile?.majorCapabilities || [],
    importantDocumentation: map.architectureDocs,
    evidenceReferences,
    contentHashes: Object.fromEntries(map.selectedFiles.map(file => [file.path, hash(file.content)])),
    lastIndexedAt: indexedAt,
  };
}

export async function getLatestRepositorySnapshot(userId: string, owner: string, repo: string): Promise<RepositorySnapshotReference | undefined> {
  if (!userId || !owner || !repo) return undefined;
  try {
    const db = getAdminFirestore();
    const repositoryId = `${owner}_${repo}`.toLowerCase();
    const snapshot = await db.collection('users').doc(userId).collection('repositorySnapshots').doc(repositoryId).get();
    if (!snapshot.exists) return undefined;
    const data = snapshot.data() || {};
    if (!data.latestAnalyzedCommitSha) return undefined;
    return {
      analyzedCommitSha: data.latestAnalyzedCommitSha,
      defaultBranch: data.defaultBranch || 'main',
      selectedFiles: Array.isArray(data.selectedFiles)
        ? data.selectedFiles
          .filter((file: any) => file && typeof file.path === 'string' && typeof file.content === 'string')
          .slice(0, 12)
          .map((file: any) => ({
            path: file.path.slice(0, 240),
            content: file.content.slice(0, 6000),
            ...(typeof file.source === 'string' ? { source: file.source.slice(0, 300) } : {}),
          }))
        : undefined,
    };
  } catch (error) {
    console.error('Latest repository snapshot lookup failed:', error instanceof Error ? error.message : 'unknown error');
    return undefined;
  }
}

export async function persistRepositorySnapshot(
  userId: string,
  context: GroundedDeepGithubContext,
  synthesizedContext?: SynthesizedContext,
) {
  if (!userId || !context.repositoryMap) return;
  try {
    const repositoryId = `${context.owner}_${context.repo}`.toLowerCase();
    const db = getAdminFirestore();
    const snapshot = buildRepositorySnapshot(context, synthesizedContext);
    if (!snapshot) return;
    await db.collection('users').doc(userId).collection('repositorySnapshots').doc(repositoryId).collection('versions').add(snapshot);
      await db.collection('users').doc(userId).collection('repositorySnapshots').doc(repositoryId).set({
        latestAnalyzedCommitSha: snapshot.analyzedCommitSha,
        defaultBranch: snapshot.defaultBranch,
      latestIndexedAt: snapshot.lastIndexedAt,
      repository: snapshot.repository,
      selectedFiles: snapshot.selectedFiles,
    }, { merge: true });
  } catch (error) {
    // Snapshot persistence is observability/context state; it must not turn a
    // successful, grounded draft into a failed user request.
    console.error('Repository snapshot persistence failed:', error instanceof Error ? error.message : 'unknown error');
  }
}

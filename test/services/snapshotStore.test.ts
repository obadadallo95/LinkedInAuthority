import { describe, expect, it } from 'vitest';
import { buildRepositorySnapshot } from '../../server/services/repositoryIntelligence/snapshotStore';

describe('repository snapshot projection', () => {
  it('persists versioned intelligence metadata and evidence references without re-reading the repository', () => {
    const context = {
      owner: 'demo-owner',
      repo: 'demo-repo',
      repoIdentity: {
        name: 'Demo Repo',
        description: 'A bounded repository fixture.',
        readmeText: '# Demo',
        manifestData: '{"name":"demo"}',
        languages: { TypeScript: 100 },
        topics: ['typescript'],
        homepageUrl: 'https://demo.example',
      },
      verifiedLinks: [],
      commits: [],
      pullRequests: [],
      issues: [],
      repositoryMap: {
        analyzedCommitSha: 'abc123',
        defaultBranch: 'main',
        tree: ['package.json', 'src/index.ts'],
        importantDirectories: ['src'],
        manifests: ['package.json'],
        frameworkConfigFiles: [],
        architectureDocs: [],
        testFiles: [],
        applicationEntryPoints: ['src/index.ts'],
        importantDomainFiles: ['src/index.ts'],
        recentChangedFiles: ['src/index.ts'],
        selectedFiles: [{
          path: 'src/index.ts',
          content: 'export const answer = 42;',
          source: 'github:file:src/index.ts@abc123',
        }],
      },
    };
    const synthesizedContext = {
      hasMeaningfulContent: true,
      summary: 'Added a small, verified feature.',
      technicalDecisions: ['Keep the module boundary explicit.'],
      challengesSolved: [],
      newFeatures: ['Verified feature flag'],
      productProfile: {
        name: 'Demo Repo',
        targetUsers: ['Developers'],
        primaryBenefits: ['Clarity'],
        majorCapabilities: ['Feature flags'],
        platforms: ['Node.js'],
        privacyCharacteristics: [],
        distributionChannels: [],
        repositoryUrl: 'https://github.com/demo-owner/demo-repo',
        verifiedLinks: [],
      },
      evidence: [{
        id: 'file:src/index.ts',
        sourceType: 'file' as const,
        reference: 'github:file:src/index.ts@abc123',
        excerpt: 'export const answer = 42;',
      }],
    };

    const snapshot = buildRepositorySnapshot(context, synthesizedContext, '2026-09-21T00:00:00.000Z');

    expect(snapshot).toMatchObject({
      analyzedCommitSha: 'abc123',
      architectureSummary: 'Added a small, verified feature.',
      majorModules: ['src'],
      majorFeatures: ['Verified feature flag'],
      verifiedProductCapabilities: ['Feature flags'],
      importantDocumentation: [],
      evidenceReferences: [{
        id: 'file:src/index.ts',
        sourceType: 'file',
        reference: 'github:file:src/index.ts@abc123',
      }],
      contentHashes: { 'src/index.ts': expect.any(String) },
      lastIndexedAt: '2026-09-21T00:00:00.000Z',
    });
    expect(snapshot?.selectedFiles[0].content).toBe('export const answer = 42;');
  });
});

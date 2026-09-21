import { describe, expect, it } from 'vitest';
import { buildRepositoryMap, selectRepositoryCandidates, withSelectedFiles } from '../../server/services/deepIntelligence/repositoryMap';

describe('repository intelligence map', () => {
  const map = buildRepositoryMap([
    { path: 'src/main.ts', type: 'blob', size: 100 },
    { path: 'src/domain/project.ts', type: 'blob', size: 100 },
    { path: 'packages/api/package.json', type: 'blob', size: 100 },
    { path: 'pnpm-workspace.yaml', type: 'blob', size: 100 },
    { path: 'turbo.json', type: 'blob', size: 100 },
    { path: 'tests/project.test.ts', type: 'blob', size: 100 },
    { path: 'docs/architecture.md', type: 'blob', size: 100 },
    { path: 'package.json', type: 'blob', size: 100 },
    { path: 'node_modules/pkg/index.js', type: 'blob', size: 100 },
    { path: 'assets/video.mp4', type: 'blob', size: 100 },
    { path: 'pnpm-lock.yaml', type: 'blob', size: 100 },
    { path: 'Cargo.lock', type: 'blob', size: 100 },
    { path: 'src/api.generated.ts', type: 'blob', size: 100 },
    { path: 'out/client.js', type: 'blob', size: 100 },
  ], 'abc123', 'main');

  it('filters generated/dependency/binary paths and classifies useful structure', () => {
    expect(map.tree).toEqual([
      'docs/architecture.md',
      'package.json',
      'packages/api/package.json',
      'pnpm-workspace.yaml',
      'src/domain/project.ts',
      'src/main.ts',
      'tests/project.test.ts',
      'turbo.json',
    ]);
    expect(map.manifests).toContain('package.json');
    expect(map.manifests).toContain('packages/api/package.json');
    expect(map.manifests).toContain('pnpm-workspace.yaml');
    expect(map.manifests).toContain('turbo.json');
    expect(map.frameworkConfigFiles).toContain('turbo.json');
    expect(map.architectureDocs).toContain('docs/architecture.md');
    expect(map.testFiles).toContain('tests/project.test.ts');
    expect(map.applicationEntryPoints).toContain('src/main.ts');
    expect(map.tree).not.toContain('pnpm-lock.yaml');
    expect(map.tree).not.toContain('Cargo.lock');
    expect(map.tree).not.toContain('src/api.generated.ts');
    expect(map.tree).not.toContain('out/client.js');
  });

  it('selects bounded candidates and attaches source references', () => {
    const candidates = selectRepositoryCandidates(map, ['src/domain/project.ts'], 3);
    expect(candidates).toEqual(['src/domain/project.ts', 'package.json', 'packages/api/package.json']);
    const selected = withSelectedFiles(map, [{ path: candidates[0], content: 'fact' }]);
    expect(selected.selectedFiles[0].source).toBe('github:file:src/domain/project.ts@abc123');
  });

  it('prioritizes changed files over stable context when building an incremental evidence pack', () => {
    const incremental = { ...map, recentChangedFiles: ['src/main.ts'] };
    expect(selectRepositoryCandidates(incremental, ['src/domain/project.ts'], 2)).toEqual([
      'src/domain/project.ts',
      'package.json'
    ]);
  });
});

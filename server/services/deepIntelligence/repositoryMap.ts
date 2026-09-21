export interface RepositoryTreeEntry {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  sha?: string;
}

export interface RepositoryMap {
  analyzedCommitSha: string;
  defaultBranch: string;
  tree: string[];
  importantDirectories: string[];
  manifests: string[];
  frameworkConfigFiles: string[];
  architectureDocs: string[];
  testFiles: string[];
  applicationEntryPoints: string[];
  importantDomainFiles: string[];
  recentChangedFiles: string[];
  selectedFiles: Array<{ path: string; content: string; source: string }>;
}

const IGNORED_PARTS = new Set([
  '.git', 'node_modules', 'vendor', 'dist', 'build', 'coverage', '.next', 'target',
  'out', 'output', 'generated', '.generated', '.cache', '.turbo', 'storybook-static',
]);
const IGNORED_FILE_NAMES = new Set([
  'package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock',
  'composer.lock', 'Cargo.lock', 'Gemfile.lock', 'poetry.lock',
]);
const IGNORED_EXTENSIONS = /\.(png|jpe?g|gif|webp|ico|svg|mp4|mov|zip|tar|gz|pdf|woff2?|ttf|eot|lock|map)$/i;
const GENERATED_FILE = /(^|\/)(.+\.)?(generated|gen|min)\.[^.]+$/i;
const MANIFESTS = new Set([
  'package.json', 'pyproject.toml', 'requirements.txt', 'go.mod', 'Cargo.toml', 'pom.xml', 'pubspec.yaml', 'composer.json',
  'pnpm-workspace.yaml', 'lerna.json', 'nx.json', 'turbo.json', 'workspace.json', 'rush.json',
]);
const CONFIG_NAMES = /^(vite|next|nuxt|astro|svelte|webpack|rollup|tsconfig|tailwind|eslint|prettier|firebase|docker|vitest|jest|playwright|cargo|gradle|pom|babel|nx|turbo|lerna|rush)/i;
const DOC_PATH = /(^|\/)(docs?|architecture|adr)(\/|$)|(^|\/)(readme|contributing|changelog|design|security|privacy|terms)(\.|\/|$)/i;
const TEST_PATH = /(^|\/)(__tests__|tests?|spec)(\/|$)|\.(test|spec)\.[^.]+$/i;
const ENTRY_PATH = /(^|\/)(main|index|server|app|cli|manage)\.[^.]+$|(^|\/)(src|app|pages)\/.*\.(tsx?|jsx?)$/i;
const DOMAIN_PATH = /(^|\/)(domain|services?|features?|modules?|core|lib|packages)\//i;

function isIgnored(path: string, size?: number) {
  const parts = path.split('/');
  const fileName = parts.at(-1) || '';
  return parts.some(part => IGNORED_PARTS.has(part))
    || IGNORED_FILE_NAMES.has(fileName)
    || IGNORED_EXTENSIONS.test(path)
    || GENERATED_FILE.test(path)
    || (size ?? 0) > 300_000;
}

function isUsefulText(path: string) {
  return /\.(c|cc|cpp|cs|go|java|js|jsx|json|md|mjs|py|rb|rs|sql|ts|tsx|toml|vue|yaml|yml)$/i.test(path);
}

export function buildRepositoryMap(entries: RepositoryTreeEntry[], analyzedCommitSha: string, defaultBranch: string): RepositoryMap {
  const files = entries.filter(entry => entry.type === 'blob' && !isIgnored(entry.path, entry.size));
  const paths = files.map(file => file.path).sort();
  const topDirs = new Set<string>();
  for (const path of paths) {
    const parts = path.split('/');
    if (parts.length > 1) topDirs.add(parts[0]);
  }
  const manifests = paths.filter(path => MANIFESTS.has(path.split('/').pop() || ''));
  const frameworkConfigFiles = paths.filter(path => CONFIG_NAMES.test(path.split('/').pop() || ''));
  const architectureDocs = paths.filter(path => DOC_PATH.test(path));
  const testFiles = paths.filter(path => TEST_PATH.test(path));
  const applicationEntryPoints = paths.filter(path => ENTRY_PATH.test(path));
  const importantDomainFiles = paths.filter(path => DOMAIN_PATH.test(path)).slice(0, 80);
  return {
    analyzedCommitSha,
    defaultBranch,
    tree: paths.slice(0, 5000),
    importantDirectories: [...topDirs].slice(0, 80),
    manifests: manifests.slice(0, 40),
    frameworkConfigFiles: frameworkConfigFiles.slice(0, 80),
    architectureDocs: architectureDocs.slice(0, 80),
    testFiles: testFiles.slice(0, 120),
    applicationEntryPoints: applicationEntryPoints.slice(0, 120),
    importantDomainFiles,
    recentChangedFiles: [],
    selectedFiles: [],
  };
}

export function selectRepositoryCandidates(map: RepositoryMap, changedFiles: string[] = [], maxFiles = 12): string[] {
  const preferred = [
    ...changedFiles,
    ...map.manifests,
    ...map.frameworkConfigFiles,
    ...map.architectureDocs,
    ...map.applicationEntryPoints,
    ...map.importantDomainFiles,
    ...map.testFiles,
  ];
  return [...new Set(preferred)].filter(path => map.tree.includes(path) && isUsefulText(path)).slice(0, maxFiles);
}

export function withSelectedFiles(map: RepositoryMap, files: Array<{ path: string; content: string; source?: string }>): RepositoryMap {
  return {
    ...map,
    selectedFiles: files.map(file => ({
      path: file.path,
      content: file.content.slice(0, 6000),
      source: file.source || `github:file:${file.path}@${map.analyzedCommitSha}`,
    })),
  };
}

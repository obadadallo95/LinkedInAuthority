import { EvidenceItem } from '../../server/services/deepIntelligence/claimAudit';

export interface ContentQualityCase {
  id: string;
  category: string;
  evidence: EvidenceItem[];
  post: string;
  suggestedComment: string;
  expected: {
    pass: boolean;
    mustContainEvidenceId?: string;
    mustWarn?: string;
  };
}

const repoUrl = 'https://github.com/example/authority-fixtures';

export const contentQualityCases: ContentQualityCase[] = [
  {
    id: 'strong-readme-feature-release',
    category: 'strong README / feature release',
    evidence: [{ id: 'file:src/feature.ts', sourceType: 'file', reference: 'src/feature.ts@a1', excerpt: 'Added incremental repository snapshots and changed-file prioritization. The analyzer now focuses on what changed instead of re-reading the entire project, making engineering updates easier to turn into grounded stories.' }],
    post: 'We added incremental repository snapshots and changed-file prioritization. The analyzer now focuses on what changed instead of re-reading the entire project, making engineering updates easier to turn into grounded stories.',
    suggestedComment: `The implementation is here: ${repoUrl}`,
    expected: { pass: true, mustContainEvidenceId: 'file:src/feature.ts' },
  },
  {
    id: 'weak-readme-human-context-needed',
    category: 'weak README',
    evidence: [{ id: 'repo:metadata', sourceType: 'metadata', reference: 'repo', excerpt: 'A small developer tool.' }],
    post: 'This release transformed how every engineering team ships software and delivered a 99% productivity gain.',
    suggestedComment: `More context: ${repoUrl}`,
    expected: { pass: false, mustWarn: 'human context' },
  },
  {
    id: 'documentation-heavy-architecture',
    category: 'documentation-heavy repo',
    evidence: [{ id: 'readme:architecture', sourceType: 'readme', reference: 'README.md', excerpt: 'The service uses a queue to separate ingestion from analysis.' }, { id: 'file:docs/architecture.md', sourceType: 'file', reference: 'docs/architecture.md', excerpt: 'We separated ingestion from analysis with a queue. That boundary gives workers room to retry safely without blocking the user-facing request.' }],
    post: 'We separated ingestion from analysis with a queue. That boundary gives workers room to retry safely without blocking the user-facing request.',
    suggestedComment: `Architecture notes: ${repoUrl}`,
    expected: { pass: true, mustContainEvidenceId: 'file:docs/architecture.md' },
  },
  {
    id: 'active-repo-bug-fix',
    category: 'active repo / bug fix',
    evidence: [{ id: 'commit:1', sourceType: 'commit', reference: 'commit:1', excerpt: 'A subtle automation bug was creating duplicate drafts. We now persist the checkpoint after the draft transaction, so a retry can safely recognize work that already succeeded.' }],
    post: 'A subtle automation bug was creating duplicate drafts. We now persist the checkpoint after the draft transaction, so a retry can safely recognize work that already succeeded.',
    suggestedComment: `Technical details: ${repoUrl}`,
    expected: { pass: true, mustContainEvidenceId: 'commit:1' },
  },
  {
    id: 'major-refactor',
    category: 'major refactor',
    evidence: [{ id: 'pull_request:7', sourceType: 'pull_request', reference: 'pull_request:7', excerpt: 'The repository intelligence pipeline is now split into map, candidate selection, evidence extraction, and generation stages. The separation makes the flow easier to inspect and evolve.' }],
    post: 'The repository intelligence pipeline is now split into map, candidate selection, evidence extraction, and generation stages. The separation makes the flow easier to inspect and evolve.',
    suggestedComment: `Read the refactor: ${repoUrl}`,
    expected: { pass: true, mustContainEvidenceId: 'pull_request:7' },
  },
  {
    id: 'trivial-noise',
    category: 'trivial change',
    evidence: [{ id: 'commit:noise', sourceType: 'commit', reference: 'commit:noise', excerpt: 'Fix typo in comment.' }],
    post: 'We fixed a typo in a comment. This shipped a revolutionary improvement to developer productivity.',
    suggestedComment: `Repository: ${repoUrl}`,
    expected: { pass: false, mustWarn: 'human review' },
  },
];

export { repoUrl };

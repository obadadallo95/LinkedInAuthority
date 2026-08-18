import { fetchWithTimeout, fetchGithubContext, cleanText } from '../github';

export interface LatestCommitInfo {
  sha: string;
  date: string;
  message: string;
}

export interface ActivityCheckOptions {
  monitorCommits?: boolean;
  monitorPullRequests?: boolean;
  monitorIssues?: boolean;
}

export interface ActivityCheckpoint {
  commitSha?: string;
  pullRequestUpdatedAt?: string;
  issueUpdatedAt?: string;
  processedAt?: string;
}

export interface ActivityDeltaResult {
  hasNewActivity: boolean;
  latestCommit?: LatestCommitInfo | null;
  latestPrUpdatedAt?: string;
  latestIssueUpdatedAt?: string;
  reasons: string[];
}

export interface GroundedDeepGithubContext {
  owner: string;
  repo: string;
  repoIdentity: {
    name: string;
    description: string;
    readmeText: string;
    manifestData: string;
    languages: Record<string, number>;
    topics: string[];
  };
  commits: Array<{ message: string; date: string; author: string }>;
  pullRequests: Array<{ title: string; body: string; merged_at: string }>;
  issues: Array<{ title: string; body: string; updated_at: string; state: string }>;
}

export type DeepGithubContext = GroundedDeepGithubContext;

function parseOwnerRepo(repoUrlOrFullName: string, repoName?: string): { owner: string; repo: string } | null {
  let owner = repoUrlOrFullName;
  let repo = repoName || '';

  if (repoUrlOrFullName.includes('github.com')) {
    const match = repoUrlOrFullName.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    owner = match[1];
    repo = match[2].endsWith('.git') ? match[2].slice(0, -4) : match[2];
  } else if (!repoName && repoUrlOrFullName.includes('/')) {
    const parts = repoUrlOrFullName.split('/');
    owner = parts[0];
    repo = parts[1];
  }

  if (!owner || !repo) return null;
  return { owner, repo };
}

function getAuthHeaders(token?: string, userAgentSuffix: string = "DeepScan"): Record<string, string> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": `LinkedIn-Content-Generator-${userAgentSuffix}`,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

export async function fetchLatestCommit(repoUrlOrFullName: string, repoName?: string, token?: string): Promise<LatestCommitInfo | null> {
  const parsed = parseOwnerRepo(repoUrlOrFullName, repoName);
  if (!parsed) return null;
  const { owner, repo } = parsed;

  const headers = getAuthHeaders(token, "CronCheck");

  try {
    const res = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0 || !data[0]?.sha) {
      return null;
    }
    return {
      sha: data[0].sha,
      date: data[0].commit?.author?.date || data[0].commit?.committer?.date || '',
      message: data[0].commit?.message || ''
    };
  } catch (error) {
    console.warn(`Failed to fetch latest commit for ${owner}/${repo}:`, error);
    return null;
  }
}

/**
 * Lightweight check to determine if any enabled source has new activity since the checkpoint.
 * Stops early if no new activity is found, making zero AI calls.
 */
export async function checkRepositoryActivityDelta(
  repoUrlOrFullName: string,
  options: ActivityCheckOptions,
  lastCheckpoint?: ActivityCheckpoint,
  token?: string
): Promise<ActivityDeltaResult> {
  const parsed = parseOwnerRepo(repoUrlOrFullName);
  if (!parsed) {
    return { hasNewActivity: false, reasons: ['Invalid repository identifier'] };
  }
  const { owner, repo } = parsed;
  const headers = getAuthHeaders(token, "DeltaCheck");

  const monitorCommits = options.monitorCommits !== false;
  const monitorPRs = options.monitorPullRequests === true;
  const monitorIssues = options.monitorIssues === true;

  let hasNewActivity = false;
  const reasons: string[] = [];
  let latestCommit: LatestCommitInfo | null = null;
  let latestPrUpdatedAt: string | undefined = undefined;
  let latestIssueUpdatedAt: string | undefined = undefined;

  const fetchTasks: Promise<any>[] = [];

  if (monitorCommits) {
    fetchTasks.push(
      fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data[0]?.sha) {
              latestCommit = {
                sha: data[0].sha,
                date: data[0].commit?.author?.date || data[0].commit?.committer?.date || '',
                message: data[0].commit?.message || ''
              };
              if (!lastCheckpoint?.commitSha || lastCheckpoint.commitSha !== latestCommit.sha) {
                hasNewActivity = true;
                reasons.push(`New commit: ${latestCommit.sha.slice(0, 7)}`);
              }
            }
          }
        })
        .catch(err => console.warn(`Commits delta check failed for ${owner}/${repo}:`, err))
    );
  }

  if (monitorPRs) {
    fetchTasks.push(
      fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=1`, { headers })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const pr = data[0];
              latestPrUpdatedAt = pr.merged_at || pr.updated_at || pr.closed_at;
              if (latestPrUpdatedAt) {
                if (!lastCheckpoint?.pullRequestUpdatedAt || new Date(latestPrUpdatedAt) > new Date(lastCheckpoint.pullRequestUpdatedAt)) {
                  hasNewActivity = true;
                  reasons.push(`Updated/merged PR: #${pr.number} (${pr.title})`);
                }
              }
            }
          }
        })
        .catch(err => console.warn(`PRs delta check failed for ${owner}/${repo}:`, err))
    );
  }

  if (monitorIssues) {
    fetchTasks.push(
      fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&sort=updated&direction=desc&per_page=5`, { headers })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              // GitHub issues API includes PRs unless filtered
              const realIssues = data.filter((i: any) => !i.pull_request);
              if (realIssues.length > 0) {
                const issue = realIssues[0];
                latestIssueUpdatedAt = issue.updated_at || issue.created_at;
                if (latestIssueUpdatedAt) {
                  if (!lastCheckpoint?.issueUpdatedAt || new Date(latestIssueUpdatedAt) > new Date(lastCheckpoint.issueUpdatedAt)) {
                    hasNewActivity = true;
                    reasons.push(`Updated Issue: #${issue.number} (${issue.title})`);
                  }
                }
              }
            }
          }
        })
        .catch(err => console.warn(`Issues delta check failed for ${owner}/${repo}:`, err))
    );
  }

  await Promise.allSettled(fetchTasks);

  return {
    hasNewActivity,
    latestCommit,
    latestPrUpdatedAt,
    latestIssueUpdatedAt,
    reasons
  };
}

/**
 * Fetches full grounded repository context:
 * 1. Stable Identity (README, Manifests, Description, Languages, Topics via fetchGithubContext)
 * 2. Monitored Activity Streams (Commits, Pull Requests, Issues)
 */
export async function fetchDeepGithubContext(
  repoUrl: string, 
  token?: string,
  options?: ActivityCheckOptions
): Promise<GroundedDeepGithubContext> {
  const parsed = parseOwnerRepo(repoUrl);
  if (!parsed) {
    throw new Error("Invalid GitHub URL format");
  }
  const { owner, repo } = parsed;
  const canonicalUrl = `https://github.com/${owner}/${repo}`;
  const headers = getAuthHeaders(token, "GroundedScan");

  const monitorCommits = options?.monitorCommits !== false;
  const monitorPRs = options?.monitorPullRequests ?? true;
  const monitorIssues = options?.monitorIssues ?? false;

  // 1. Fetch stable repository identity first
  const ghBaseContext = await fetchGithubContext(canonicalUrl, token);

  // 2. Fetch enabled activity streams in parallel
  const asyncTasks: [
    Promise<Response | null>,
    Promise<Response | null>,
    Promise<Response | null>
  ] = [
    monitorCommits
      ? fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=15`, { headers })
      : Promise.resolve(null),
    monitorPRs
      ? fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&per_page=10`, { headers })
      : Promise.resolve(null),
    monitorIssues
      ? fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&sort=updated&direction=desc&per_page=10`, { headers })
      : Promise.resolve(null)
  ];

  const [commitsRes, prsRes, issuesRes] = await Promise.allSettled(asyncTasks);

  let commits: Array<{ message: string; date: string; author: string }> = [];
  if (commitsRes.status === 'fulfilled' && commitsRes.value?.ok) {
    const data = await commitsRes.value.json();
    commits = (Array.isArray(data) ? data : []).map((c: any) => ({
      message: c.commit?.message || '',
      date: c.commit?.author?.date || '',
      author: c.commit?.author?.name || ''
    }));
  }

  let pullRequests: Array<{ title: string; body: string; merged_at: string }> = [];
  if (prsRes.status === 'fulfilled' && prsRes.value?.ok) {
    const data = await prsRes.value.json();
    pullRequests = (Array.isArray(data) ? data : [])
      .filter((pr: any) => pr.merged_at != null)
      .map((pr: any) => ({
        title: pr.title || '',
        body: pr.body ? cleanText(pr.body, 300) : '',
        merged_at: pr.merged_at || ''
      }));
  }

  let issues: Array<{ title: string; body: string; updated_at: string; state: string }> = [];
  if (issuesRes.status === 'fulfilled' && issuesRes.value?.ok) {
    const data = await issuesRes.value.json();
    issues = (Array.isArray(data) ? data : [])
      .filter((i: any) => !i.pull_request)
      .map((i: any) => ({
        title: i.title || '',
        body: i.body ? cleanText(i.body, 300) : '',
        updated_at: i.updated_at || '',
        state: i.state || 'open'
      }));
  }

  return {
    owner,
    repo,
    repoIdentity: {
      name: ghBaseContext.repoData.name || repo,
      description: ghBaseContext.repoData.description || '',
      readmeText: ghBaseContext.readmeText || '',
      manifestData: ghBaseContext.manifestData || '',
      languages: ghBaseContext.languages || {},
      topics: ghBaseContext.repoData.topics || []
    },
    commits,
    pullRequests,
    issues
  };
}

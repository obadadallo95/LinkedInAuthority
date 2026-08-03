import { fetchWithTimeout } from '../github';

export interface DeepGithubContext {
  owner: string;
  repo: string;
  commits: any[];
  pullRequests: any[];
}

export async function fetchDeepGithubContext(repoUrl: string, token?: string): Promise<DeepGithubContext> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL format");
  }

  const owner = match[1];
  let repo = match[2];
  if (repo.endsWith('.git')) repo = repo.slice(0, -4);

  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "LinkedIn-Content-Generator-DeepScan",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // Fetch commits and PRs in parallel
    const [commitsRes, prsRes] = await Promise.allSettled([
      fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=15`, { headers }),
      fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&per_page=10`, { headers })
    ]);

    let commits: any[] = [];
    if (commitsRes.status === 'fulfilled' && commitsRes.value.ok) {
      const data = await commitsRes.value.json();
      // Simplify to save context window tokens
      commits = (Array.isArray(data) ? data : []).map((c: any) => ({
        message: c.commit?.message || '',
        date: c.commit?.author?.date || '',
        author: c.commit?.author?.name || ''
      }));
    }

    let pullRequests: any[] = [];
    if (prsRes.status === 'fulfilled' && prsRes.value.ok) {
      const data = await prsRes.value.json();
      pullRequests = (Array.isArray(data) ? data : [])
        .filter((pr: any) => pr.merged_at != null) // Only want merged PRs
        .map((pr: any) => ({
          title: pr.title,
          body: pr.body ? pr.body.substring(0, 300) : '',
          merged_at: pr.merged_at
        }));
    }

    return {
      owner,
      repo,
      commits,
      pullRequests
    };
  } catch (error: any) {
    console.error("Error in Deep Scan fetch:", error);
    throw new Error("Failed to perform deep scan on the repository. " + error.message);
  }
}

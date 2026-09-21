export const SUPPORTED_MANIFESTS = [
  'package.json',
  'pubspec.yaml',
  'Cargo.toml',
  'pyproject.toml',
  'requirements.txt',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts'
];

export interface GithubContext {
  owner: string;
  repo: string;
  repoData: any;
  languages: any;
  readmeText: string;
  manifestData: string;
  hasWeakRepo: boolean;
}

export function cleanText(text: string, limit: number): string {
  if (!text) return "";
  let cleaned = text.replace(/!\[.*?\]\(.*?\)/g, ''); // images
  cleaned = cleaned.replace(/<[^>]*>?/gm, ''); // html tags
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, ''); // html comments
  return cleaned.substring(0, limit).trim();
}

export const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
};

export async function fetchGithubContext(repoUrl: string, token?: string): Promise<GithubContext> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL format");
  }
  
  const owner = match[1];
  const repo = match[2].replace(".git", "");

  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json"
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  // Parallel fetch: Metadata, Languages, Root Contents, README
  const [repoRes, langRes, contentsRes, readmeRes] = await Promise.allSettled([
    fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
    fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }),
    fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers }),
    fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers: { ...headers, "Accept": "application/vnd.github.v3.raw" } })
  ]);

  // Handle Rate Limiting & Basics
  if (repoRes.status === 'fulfilled' && repoRes.value.status === 403) {
     throw new Error("GitHub API rate limit exceeded. Please try again later.");
  }
  if (repoRes.status === 'fulfilled' && !repoRes.value.ok) {
     throw new Error("Repository not found or private.");
  }
  if (repoRes.status === 'rejected') {
     throw new Error("Failed to connect to GitHub.");
  }

  const repoData = await repoRes.value.json();
  
  let languages = {};
  if (langRes.status === 'fulfilled' && langRes.value.ok) {
    languages = await langRes.value.json();
  }

  let readmeText = "";
  if (readmeRes.status === 'fulfilled' && readmeRes.value.ok) {
    readmeText = await readmeRes.value.text();
    readmeText = cleanText(readmeText, 7000);
  }

  // Fallback: Fetch Manifests if found in contents
  let manifestData = "";
  if (contentsRes.status === 'fulfilled' && contentsRes.value.ok) {
    const contents = await contentsRes.value.json();
    if (Array.isArray(contents)) {
      const foundManifests = contents
        .filter((f: any) => f.type === 'file' && SUPPORTED_MANIFESTS.includes(f.name))
        .slice(0, 2); // Get at most 2 manifests
      
      if (foundManifests.length > 0) {
        const manifestPromises = foundManifests.map((f: any) => 
          fetchWithTimeout(f.download_url, { headers: { "Accept": "application/vnd.github.v3.raw" } })
        );
        const resolvedManifests = await Promise.allSettled(manifestPromises);
        for (let i = 0; i < resolvedManifests.length; i++) {
          const m = resolvedManifests[i];
          if (m.status === 'fulfilled' && m.value.ok) {
            const text = await m.value.text();
            manifestData += `\n--- ${foundManifests[i].name} ---\n${cleanText(text, 2000)}`;
          }
        }
      }
    }
  }

  const hasWeakRepo = readmeText.length < 100 && manifestData.length === 0;

  return {
    owner,
    repo,
    repoData,
    languages,
    readmeText,
    manifestData,
    hasWeakRepo
  };
}

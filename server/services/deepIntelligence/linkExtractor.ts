export type VerifiedLinkType = 
  | 'homepage'
  | 'mac_app_store'
  | 'microsoft_store'
  | 'chrome_web_store'
  | 'app_store'
  | 'google_play'
  | 'web_app'
  | 'docs'
  | 'github_releases'
  | 'github_repo'
  | 'other';

export interface VerifiedLink {
  type: VerifiedLinkType;
  url: string;
  label?: string;
}

export function classifyUrl(url: string, label?: string): VerifiedLinkType {
  const cleanUrl = url.trim().toLowerCase();
  const cleanLabel = (label || '').trim().toLowerCase();

  // Mac App Store / Apple App Store
  if (cleanUrl.includes('apps.apple.com') || cleanUrl.includes('itunes.apple.com')) {
    if (cleanUrl.includes('/mac-app/') || cleanUrl.includes('mt=12') || cleanUrl.includes('platform=mac') || cleanLabel.includes('mac')) {
      return 'mac_app_store';
    }
    return 'app_store';
  }

  // Microsoft Store
  if (cleanUrl.includes('apps.microsoft.com') || (cleanUrl.includes('microsoft.com') && (cleanUrl.includes('/store') || cleanUrl.includes('/p/')))) {
    return 'microsoft_store';
  }

  // Chrome Web Store
  if (cleanUrl.includes('chromewebstore.google.com') || cleanUrl.includes('chrome.google.com/webstore')) {
    return 'chrome_web_store';
  }

  // Google Play
  if (cleanUrl.includes('play.google.com/store')) {
    return 'google_play';
  }

  // GitHub Releases & Repo
  if (cleanUrl.includes('github.com')) {
    if (cleanUrl.includes('/releases')) {
      return 'github_releases';
    }
    return 'github_repo';
  }

  // Documentation
  if (cleanUrl.includes('/docs') || cleanUrl.includes('docs.') || cleanUrl.includes('documentation') || cleanLabel.includes('doc')) {
    return 'docs';
  }

  // Web App / PWA
  if (cleanLabel.includes('web app') || cleanLabel.includes('pwa') || cleanLabel.includes('live demo') || cleanLabel.includes('try online')) {
    return 'web_app';
  }

  // Homepage
  if (cleanLabel.includes('home') || cleanLabel.includes('website') || cleanLabel.includes('landing') || cleanLabel.includes('official')) {
    return 'homepage';
  }

  return 'other';
}

function isValidHttpUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function cleanUrlString(raw: string): string {
  // Strip trailing punctuation often captured from markdown or sentences
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/[.,;:)>\]"'\\]+$/, '');
  return cleaned;
}

/**
 * Deterministically extracts and classifies verified links from repository metadata and README text.
 * Never invents, guesses, or hallucinates URLs.
 */
export function extractVerifiedLinks(
  owner: string,
  repo: string,
  repoDataHomepage?: string,
  readmeText?: string,
  manifestData?: string
): VerifiedLink[] {
  const linkMap = new Map<string, VerifiedLink>();

  const canonicalRepoUrl = `https://github.com/${owner}/${repo}`;
  const canonicalReleasesUrl = `https://github.com/${owner}/${repo}/releases`;

  // 1. Repository Homepage from GitHub metadata (Highest trust for homepage)
  if (repoDataHomepage && typeof repoDataHomepage === 'string') {
    const hp = cleanUrlString(repoDataHomepage);
    if (isValidHttpUrl(hp)) {
      const type = classifyUrl(hp, 'Official Homepage');
      linkMap.set(hp, {
        type: type === 'other' ? 'homepage' : type,
        url: hp,
        label: 'Official Website'
      });
    }
  }

  // 2. Canonical GitHub Repo & Releases
  linkMap.set(canonicalRepoUrl, {
    type: 'github_repo',
    url: canonicalRepoUrl,
    label: 'GitHub Repository'
  });

  // 3. Extract links from README markdown & HTML
  if (readmeText) {
    // Markdown links with support for nested image badges: [![alt](img)](url) or [Label](url)
    const mdLinkRegex = /\[(?:!\[([^\]]*)\]\([^)]*\)|([^\]]+))\]\((https?:\/\/[^\s\)]+)\)/g;
    let match;
    while ((match = mdLinkRegex.exec(readmeText)) !== null) {
      const label = (match[1] || match[2] || '').trim();
      const rawUrl = cleanUrlString(match[3]);
      if (isValidHttpUrl(rawUrl) && !linkMap.has(rawUrl)) {
        // Exclude image hosting/badge URLs from being target destinations
        if (!rawUrl.includes('img.shields.io') && !rawUrl.includes('badge.fury.io') && !rawUrl.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
          const type = classifyUrl(rawUrl, label);
          linkMap.set(rawUrl, {
            type,
            url: rawUrl,
            label: label || undefined
          });
        }
      }
    }

    // HTML href links: <a href="url">Label</a>
    const htmlLinkRegex = /<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/[^"'\s>]+)["'][^>]*>(.*?)<\/a>/gi;
    while ((match = htmlLinkRegex.exec(readmeText)) !== null) {
      const rawUrl = cleanUrlString(match[1]);
      const label = match[2].replace(/<[^>]*>/g, '').trim();
      if (isValidHttpUrl(rawUrl) && !linkMap.has(rawUrl)) {
        if (!rawUrl.includes('img.shields.io') && !rawUrl.includes('badge.fury.io')) {
          const type = classifyUrl(rawUrl, label);
          linkMap.set(rawUrl, {
            type,
            url: rawUrl,
            label: label || undefined
          });
        }
      }
    }

    // Standalone URLs (e.g. in list or plaintext)
    const urlRegex = /(https?:\/\/[^\s<>"'\)\]]+)/g;
    while ((match = urlRegex.exec(readmeText)) !== null) {
      const rawUrl = cleanUrlString(match[1]);
      if (isValidHttpUrl(rawUrl) && !linkMap.has(rawUrl)) {
        if (!rawUrl.includes('img.shields.io') && !rawUrl.includes('github.com/actions') && !rawUrl.includes('badge.fury.io')) {
          const type = classifyUrl(rawUrl);
          // Only add notable platforms/destinations if found as raw URL
          if (type !== 'other' || rawUrl.includes(repo.toLowerCase())) {
            linkMap.set(rawUrl, {
              type,
              url: rawUrl
            });
          }
        }
      }
    }
  }

  // 4. Extract from manifest if JSON contains homepage
  if (manifestData) {
    try {
      const parsed = JSON.parse(manifestData);
      if (parsed.homepage && isValidHttpUrl(parsed.homepage) && !linkMap.has(parsed.homepage)) {
        const type = classifyUrl(parsed.homepage, 'Homepage');
        linkMap.set(parsed.homepage, {
          type: type === 'other' ? 'homepage' : type,
          url: cleanUrlString(parsed.homepage),
          label: 'Package Homepage'
        });
      }
    } catch (_) {
      // Manifest might be YAML or TOML, ignore JSON parse error
    }
  }

  return Array.from(linkMap.values());
}

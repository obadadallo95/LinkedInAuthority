const fs = require('fs');
let code = fs.readFileSync('src/services/githubService.ts', 'utf8');

const goodCode = `export async function fetchProfile(username: string, token?: string) {
  // handled within /api/settings post in current implementation
}

export async function fetchRepos(username: string, token?: string, orgFilter?: string) {`;

let lines = code.split('\n');
let startIndex = lines.findIndex(l => l.includes('export async function fetchProfile'));
let endIndex = lines.findIndex(l => l.includes('export async function fetchRepos'));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex + 1, goodCode);
  fs.writeFileSync('src/services/githubService.ts', lines.join('\n'));
} else {
  console.log("Could not find boundaries", startIndex, endIndex);
}

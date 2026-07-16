#!/bin/bash
sed -i '/export function getFallbackRepos/,/\];/d' src/services/githubService.ts
sed -i '/export function getFallbackReposForOrg/,/\];/d' src/services/githubService.ts

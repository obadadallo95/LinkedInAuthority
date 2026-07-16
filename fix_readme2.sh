#!/bin/bash
sed -i '/return `# ${repo}/,/your developer profile.`;/c\
  throw new Error("No online README.md could be retrieved.");' src/services/githubService.ts

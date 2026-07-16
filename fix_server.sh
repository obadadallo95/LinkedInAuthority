#!/bin/bash
# Remove fallback arrays and conditions
sed -i 's/console.warn("GitHub API error or offline fallback activated:", err);/console.error("GitHub API error:", err);/' server.ts
sed -i '/\/\/ Fallback description if APIs failed or were not fully configured/,+10c\
    if (!readmeContent \&\& !repoDescription) {\
      return res.status(400).json({ error: "Could not fetch repository data. Ensure the repository exists and the GitHub token has the correct permissions." });\
    }' server.ts

# Delete arrays from const arPosts to end of enPosts
sed -i '/const arPosts = \[/,/];/d' server.ts
sed -i '/const enPosts = \[/,/];/d' server.ts

# Update client check
sed -i 's/return res.json({ posts: lang === "ar" ? arPosts : enPosts });/return res.status(500).json({ error: "Gemini API client is not configured. Please add GEMINI_API_KEY in the settings." });/' server.ts

# Update fallback return at bottom of analyze-repo
sed -i 's/return res.json({ posts: lang === "ar" ? arPosts : enPosts });/return res.status(500).json({ error: "Failed to generate posts from AI." });/' server.ts


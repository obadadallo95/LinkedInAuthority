# Simple script to check what files need to be modified.
grep -rn "selectedMainIntent" src/pages/LandingPage.tsx
grep -rn "analysisCache" server/services/repositoryIntelligence/cache.ts
grep -rn "conflicts = \\[\\]" server/services/repositoryIntelligence/generatePost.ts

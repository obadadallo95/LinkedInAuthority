const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const goodAnCode = `  // Deep Scan codebase to generate three premium drafts
  const handleAnalyzeRepo = async (overrideRepos?: string[], branch?: string) => {
    const targetRepos = overrideRepos && overrideRepos.length > 0 ? overrideRepos : [selectedRepo];
    if (targetRepos.length === 0 || !targetRepos[0]) return;
    setAnalyzingRepo(true);
    try {
      let firstPostId = null;
      for (const repoName of targetRepos) {
        const res = await fetch("/api/analyze-repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: settings.githubUsername,
            token: settings.githubToken,
            repo: repoName,
            branch: branch || 'main',
            template: selectedTemplate,
            lang,
          })
        });

        if (res.ok) {
          const data = await res.json();
          const postsRef = collection(db, "users", user.uid, "posts");
          for (const postItem of data.posts) {
            const docRef = await addDoc(postsRef, {
              repoName: repoName,
              text: postItem.text,
              status: 'draft',
              createdAt: new Date().toISOString(),
              cardConfig: postItem.cardConfig || {
                colorTheme: 'indigo',
                title: repoName.toUpperCase(),
                subtitle: 'Automated Code Architecture Analysis',
                metrics: 'SEO ACTIVE'
              }
            });
            if (!firstPostId) firstPostId = docRef.id;
          }
        } else {
          console.error("Failed to analyze repo", repoName);
          throw new Error("GitHub Repository fetch limit or analysis error on " + repoName);
        }
      }

      if (firstPostId) {
        setActivePostId(firstPostId);
        setActiveTab('posts');
      }
      showToast(lang === 'ar' ? "تم الانتهاء من التحليل والتوليد ✓" : "Analysis and drafting completed ✓");
    } catch (err) {
      console.error(err);
      showToast(lang === 'ar' ? "فشل تحليل المستودع" : "Failed to analyze repository");
    } finally {
      setAnalyzingRepo(false);
    }
  };
`;

let lines = code.split('\n');
let startIndex = lines.findIndex(l => l.includes('// Deep Scan codebase to generate three premium drafts'));
let endIndex = lines.findIndex(l => l.includes('const handleUpdatePostText'));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex, goodAnCode);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
} else {
  console.log("Could not find boundaries", startIndex, endIndex);
}

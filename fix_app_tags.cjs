const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const goodTagsCode = `  // Generate hashtags for the current post text
  const handleGenerateHashtags = async (text: string, currentLang: string) => {
    if (!text) return;
    setGeneratingHashtagsState(true);
    try {
      const res = await fetch("/api/generate-hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: currentLang })
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedHashtags(data.hashtags || []);
        showToast(lang === 'ar' ? "تم توليد الهاشتاغات الذكية المقترحة بنجاح! ✨" : "Smart hashtags optimized successfully! ✨");
      } else {
        const err = await res.json();
        throw new Error(err.error || "AI hashtag generation failed");
      }
    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? "حدث خطأ" : "An error occurred");
    } finally {
      setGeneratingHashtagsState(false);
    }
  };
`;

let lines = code.split('\n');
let startIndex = lines.findIndex(l => l.includes('// Generate hashtags for the current post text'));
let endIndex = lines.findIndex(l => l.includes('// Append tags to the active post draft'));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex, goodTagsCode);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
} else {
  console.log("Could not find boundaries", startIndex, endIndex);
}

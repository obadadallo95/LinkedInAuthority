const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const goodDiscCode = `  // Disconnect accounts channel helper
  const handleDisconnect = async (platform: 'github' | 'linkedin') => {
    if (!user?.uid) return;
    try {
      const settingsRef = doc(db, "users", user.uid, "settings", "current");
      if (platform === 'github') {
        await setDoc(settingsRef, {
          githubUsername: "",
          githubToken: "",
          githubProfile: null,
        }, { merge: true });
      } else {
        await setDoc(settingsRef, {
          linkedinToken: "",
          linkedinProfile: null,
        }, { merge: true });
      }
      showToast(lang === 'ar' ? "تم فصل القناة المحددة بنجاح ✓" : "Channel disconnected successfully ✓");
    } catch (e) {
      showToast(lang === 'ar' ? "حدث خطأ" : "An error occurred");
    }
  };
`;

let lines = code.split('\n');
let startIndex = lines.findIndex(l => l.includes('// Disconnect accounts channel helper'));
let endIndex = lines.findIndex(l => l.includes('// Deep Scan codebase to generate three premium drafts'));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex, goodDiscCode);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
} else {
  console.log("Could not find boundaries", startIndex, endIndex);
}

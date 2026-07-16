const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const goodSaveCode = `  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    try {
      const settingsRef = doc(db, "users", user.uid, "settings", "current");
      
      let githubProfile = null;
      if (inputs.ghUsernameInput) {
        try {
          const res = await fetch(\`https://api.github.com/users/\${inputs.ghUsernameInput}\`);
          if (res.ok) {
            githubProfile = await res.json();
          }
        } catch (err) {
          console.error("Failed to fetch Github profile avatar:", err);
        }
      }

      let linkedinProfile = null;
      if (inputs.liTokenInput) {
        linkedinProfile = {
          name: user.displayName || "LinkedIn Executive",
          picture: user.photoURL || "",
        };
      }

      await setDoc(settingsRef, {
        githubUsername: inputs.ghUsernameInput,
        githubToken: inputs.ghTokenInput,
        linkedinToken: inputs.liTokenInput,
        githubProfile,
        linkedinProfile,
      }, { merge: true });

      showToast(lang === 'ar' ? "تم حفظ الإعدادات وربط القنوات بنجاح! ✓" : "Settings saved and channels linked! ✓");
    } catch (err) {
      console.error("Error saving settings:", err);
      showToast(lang === 'ar' ? "حدث خطأ أثناء حفظ الإعدادات" : "Failed to save settings");
    }
  };
`;

let lines = code.split('\n');
let startIndex = lines.findIndex(l => l.includes('const handleSaveSettings = async (e: React.FormEvent) => {'));
let endIndex = lines.findIndex(l => l.includes('// Disconnect accounts channel helper'));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex, goodSaveCode);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
} else {
  console.log("Could not find boundaries", startIndex, endIndex);
}

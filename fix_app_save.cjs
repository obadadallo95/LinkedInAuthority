const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const goodSaveCode = `  // Handle saving the user configuration panel
  const handleSaveSettings = async (e: React.FormEvent) => {
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

      showToast(isAr ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully");
    } catch (err) {
      console.error("Error saving settings:", err);
      showToast(isAr ? "فشل حفظ الإعدادات" : "Failed to save settings");
    }
  };
`;

let lines = code.split('\n');
let startIndex = lines.findIndex(l => l.includes('const handleSaveSettings = async (e: React.FormEvent) => {'));
let endIndex = lines.findIndex(l => l.includes('console.error("Error saving settings:", err);'));

// The end block for handleSaveSettings actually ends after showToast("Failed to save settings");
// Let's find the closing brace after that.
if (startIndex !== -1 && endIndex !== -1) {
  let realEndIndex = endIndex + 3; // "showToast...", "}", "};"
  lines.splice(startIndex - 1, realEndIndex - startIndex + 2, goodSaveCode);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
} else {
  console.log("Could not find handleSaveSettings");
}

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const goodUpdCode = `  const handleUpdatePostText = async (newText: string) => {
    if (!activePostId) return;
    try {
      const postRef = doc(db, "users", user.uid, "posts", activePostId);
      await updateDoc(postRef, {
        text: newText,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to sync post text to Firestore:", e);
    }
  };

  // Update current post's card configuration
  const handleUpdateCardConfig = async (field: string, val: string) => {
    if (!activePostId) return;
    const currentPost = posts.find(p => p.id === activePostId);
    if (!currentPost) return;
    try {
      const postRef = doc(db, "users", user.uid, "posts", activePostId);
      const newConfig = { ...currentPost.cardConfig, [field]: val };
      await updateDoc(postRef, {
        cardConfig: newConfig,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to update card config:", e);
    }
  };
`;

let lines = code.split('\n');
let startIndex = lines.findIndex(l => l.includes('const handleUpdatePostText ='));
let endIndex = lines.findIndex(l => l.includes('// Generate hashtags for the current post text'));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex, goodUpdCode);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
} else {
  console.log("Could not find boundaries", startIndex, endIndex);
}

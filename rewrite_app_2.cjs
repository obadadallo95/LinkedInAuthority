const fs = require('fs');

let originalCode = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace imports
originalCode = originalCode.replace(
  `import { useAuth, AuthProvider } from './application/AuthContext';`,
  `import { useAuth, AuthProvider } from './application/AuthContext';\nimport { useSettings } from './contexts/SettingsContext';\nimport { usePosts } from './contexts/PostsContext';`
);

// Replace state hooks
originalCode = originalCode.replace(
  `  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);`,
  `  const { posts, loadingPosts, updatePostText, updateCardConfig, deletePost, schedulePost, cancelSchedule, saveAsTemplate, useTemplate } = usePosts();`
);

originalCode = originalCode.replace(
  `  // Settings state
  const [settings, setSettings] = useState<any>({
    githubUsername: "",
    githubToken: "",
    linkedinToken: "",
    githubProfile: null,
    linkedinProfile: null,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);`,
  `  const { settings, loadingSettings, saveSettings, disconnectChannel } = useSettings();`
);

// We still need local inputs state for the settings panel since it's a form?
// Wait, the context just takes the final inputs. The local form inputs should still be in App, or moved to SettingsPanel.
// SettingsPanel accepts `inputs` and `setInputs`. We'll keep them in App for now.

// Remove the onSnapshot useEffect
const snapshotRegex = /  \/\/ Listen to Firestore real-time changes[\s\S]*?\}, \[user\?\.uid\]\);/g;
originalCode = originalCode.replace(snapshotRegex, '');

// Remove the old handler functions that are now in context
const functionsToRemove = [
  /  const handleUpdatePostText = async \([\s\S]*?\};/g,
  /  \/\/ Update current post's card configuration[\s\S]*?  const handleUpdateCardConfig = async \([\s\S]*?\};/g,
  /  \/\/ Schedule release publishing for a future date\/time[\s\S]*?  const handleSchedulePost = async \([\s\S]*?\};/g,
  /  \/\/ Cancel scheduling, reverting post back to draft[\s\S]*?  const handleCancelSchedule = async \([\s\S]*?\};/g,
  /  \/\/ Delete\/Discard draft completely[\s\S]*?  const handleDeletePost = async \([\s\S]*?\};/g,
  /  const handleSaveAsTemplate = async \([\s\S]*?\};/g,
  /  const handleUseTemplate = async \([\s\S]*?\};/g,
];

functionsToRemove.forEach(regex => {
  originalCode = originalCode.replace(regex, '');
});

// For handleSaveSettings, it used to use inputs. Now we can redefine it to use saveSettings
originalCode = originalCode.replace(
  /  \/\/ Handle saving the user configuration panel[\s\S]*?  const handleSaveSettings = async \(e: React\.FormEvent\) => \{[\s\S]*?  \};/g,
  `  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings(inputs.ghUsernameInput, inputs.ghTokenInput, inputs.liTokenInput);
      showToast(lang === 'ar' ? "تم حفظ الإعدادات وربط القنوات بنجاح! ✓" : "Settings saved and channels linked! ✓");
    } catch(err) {
      console.error(err);
      showToast(lang === 'ar' ? "حدث خطأ أثناء حفظ الإعدادات" : "Failed to save settings");
    }
  };`
);

// For handleDisconnect
originalCode = originalCode.replace(
  /  \/\/ Disconnect accounts channel helper[\s\S]*?  const handleDisconnect = async \(platform: 'github' \| 'linkedin'\) => \{[\s\S]*?  \};/g,
  `  const handleDisconnect = async (platform: 'github' | 'linkedin') => {
    try {
      await disconnectChannel(platform);
      showToast(lang === 'ar' ? "تم فصل القناة المحددة بنجاح ✓" : "Channel disconnected successfully ✓");
    } catch(e) {
      showToast(lang === 'ar' ? "حدث خطأ" : "An error occurred");
    }
  };`
);

fs.writeFileSync('src/App.tsx', originalCode);
console.log('App.tsx rewritten!');

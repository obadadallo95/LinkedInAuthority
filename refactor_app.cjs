const fs = require('fs');

const originalCode = fs.readFileSync('src/App.tsx', 'utf-8');

let newCode = originalCode
  .replace(
    `import { useAuth, AuthProvider } from './application/AuthContext';`,
    `import { useAuth, AuthProvider } from './application/AuthContext';\nimport { useSettings } from './contexts/SettingsContext';\nimport { usePosts } from './contexts/PostsContext';`
  )
  .replace(
    `const [posts, setPosts] = useState<any[]>([]);\n  const [loadingPosts, setLoadingPosts] = useState(true);`,
    `const { posts, loadingPosts, updatePostText, updateCardConfig, deletePost, schedulePost, cancelSchedule, saveAsTemplate, useTemplate } = usePosts();`
  )
  .replace(
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

fs.writeFileSync('src/App.temp.tsx', newCode);
console.log('Done replacement part 1');

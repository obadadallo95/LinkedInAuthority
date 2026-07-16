const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const goodCode = `
  // Settings state
  const [settings, setSettings] = useState<any>({
    githubUsername: "",
    githubToken: "",
    linkedinToken: "",
    githubProfile: null,
    linkedinProfile: null,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Form inputs for Settings Panel
  const [inputs, setInputs] = useState({
    ghUsernameInput: "",
    ghTokenInput: "",
    liTokenInput: "",
  });

  // Repositories state
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [orgFilter, setOrgFilter] = useState<string>('Personal');
  const [orgs, setOrgs] = useState<any[]>([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("general");
  const [analyzingRepo, setAnalyzingRepo] = useState(false);

  // Generator Modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'developer'>('privacy');

  // Suggested tags state
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  // Language state
  const [lang, setLang] = useState<'en' | 'ar' | 'de'>(
    (localStorage.getItem('linkedin_auth_lang') as 'en' | 'ar' | 'de') || 'en'
  );

  const handleToggleLang = (target?: 'en' | 'ar' | 'de') => {
    let nextLang = lang;
    if (target) {
      nextLang = target;
    } else {
      nextLang = lang === 'ar' ? 'en' : lang === 'en' ? 'de' : 'ar';
    }
    setLang(nextLang);
    try {
      localStorage.setItem('linkedin_auth_lang', nextLang);
    } catch (e) {}
  };

  const showToast = (message: string) => {
    setToast({ show: true, message });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Listen to Firestore real-time changes
  useEffect(() => {
    if (!user?.uid) return;

    setLoadingSettings(true);
    setLoadingPosts(true);

    // 1. Subscribe to Settings Document
    const settingsRef = doc(db, "users", user.uid, "settings", "current");
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);
        setInputs({
          ghUsernameInput: data.githubUsername || "",
          ghTokenInput: data.githubToken || "",
          liTokenInput: data.linkedinToken || "",
        });
      } else {
        setSettings({
          githubUsername: "",
          githubToken: "",
          linkedinToken: "",
          githubProfile: null,
          linkedinProfile: null,
        });
        setInputs({
          ghUsernameInput: "",
          ghTokenInput: "",
          liTokenInput: "",
        });
      }
      setLoadingSettings(false);
    }, (error) => {
      console.error("Settings listener error:", error);
      setLoadingSettings(false);
    });

    // 2. Subscribe to Posts Collection
    const postsRef = collection(db, "users", user.uid, "posts");
    const unsubscribePosts = onSnapshot(postsRef, (querySnap) => {
      const list: any[] = [];
      querySnap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort posts by date descending
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setPosts(list);
      setLoadingPosts(false);
    }, (error) => {
      console.error("Posts listener error:", error);
      setLoadingPosts(false);
    });

    return () => {
      unsubscribeSettings();
      unsubscribePosts();
    };
  }, [user?.uid]);
`;

let lines = code.split('\n');
let startIndex = lines.findIndex(l => l.includes('// Settings state'));
let endIndex = lines.findIndex(l => l.includes('}, [user?.uid]);'));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex + 1, goodCode);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
} else {
  console.log("Could not find start or end index", startIndex, endIndex);
}

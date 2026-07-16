const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const replaceStr = `  const handleToggleLang = (target?: 'en' | 'ar' | 'de') => {
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
`;

let lines = code.split('\\n');
let newLines = [...lines.slice(0, 94), replaceStr, ...lines.slice(160)];
fs.writeFileSync('src/App.tsx', newLines.join('\\n'));

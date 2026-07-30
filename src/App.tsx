import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './application/AuthContext';
import { useSettings } from './contexts/SettingsContext';
import { usePosts } from './contexts/PostsContext';
import { db } from './infrastructure/firebase/config';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';

import { Sidebar } from './components/Layout/Sidebar';
import { MobileNav } from './components/Layout/MobileNav';
import { Header } from './components/Layout/Header';
import { RepositoriesDashboard } from './components/RepositoriesDashboard';
import { RepoDetails } from './components/RepoDetails';
import { DraftsDashboard } from './components/DraftsDashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { GeneratorModal } from './components/GeneratorModal';
import { LegalModal } from './components/Layout/LegalModal';
import { FloatingHelpWidget } from './components/FloatingHelpWidget';
import { AboutUsModal } from './components/Layout/AboutUsModal';
import { TemplatesPanel } from './components/TemplatesPanel';
import { PwaPrompt } from './components/shared/PwaPrompt';
import { LandingPage } from './pages/LandingPage';
import { OnboardingWizard } from './pages/OnboardingWizard';
import { fetchRepos, fetchOrgs } from './services/githubService';
import { t } from './locales';
import { updatePageMetadata, injectJSONLD, SchemaTemplates } from './utils/MetadataUtils';

import { 
  Sparkles, 
  RefreshCw, 
  Terminal
} from 'lucide-react';

function App() {
  const { user, loading, signOut } = useAuth();
  const [lang, setLang] = useState<'ar' | 'en' | 'de'>(() => {
    try {
      const saved = localStorage.getItem('linkedin_auth_lang');
      return (saved === 'ar' || saved === 'en' || saved === 'de') ? saved : 'ar';
    } catch (e) {
      return 'ar';
    }
  });
  const isAr = lang === 'ar';
  const [toast, setToast] = useState({ show: false, message: "" });
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");


  const { posts, loadingPosts, updatePostText, updateCardConfig, deletePost, schedulePost, cancelSchedule, saveAsTemplate, useTemplate } = usePosts();
  const [activePostId, setActivePostId] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Infer activeTab from location path
  const currentPath = location.pathname;
  let activeTab: 'home' | 'drafts' | 'analytics' | 'templates' | 'settings' | 'logs' = 'home';
  if (currentPath.startsWith('/settings')) activeTab = 'settings';
  else if (currentPath.startsWith('/templates')) activeTab = 'templates';
  else if (currentPath.startsWith('/drafts')) activeTab = 'drafts';


  const { settings, loadingSettings, saveSettings, disconnectChannel, isOnboardingComplete } = useSettings();

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
  const [demoMode, setDemoMode] = useState(false);

  // Generator Modal state
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'developer'>('privacy');

  // Suggested tags state
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);


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

  // Dynamic B2B Meta-tags and JSON-LD structured data update based on tab & language
  useEffect(() => {
    const isAr = lang === 'ar';
    const isDe = lang === 'de';
    
    let pageTitle = "LinkedIn Authority Engine | Professional B2B Content Automation";
    let pageDesc = "Enterprise-grade AI-powered content automation platform for engineering leaders and developers. Seamlessly turn GitHub repositories, source files, and developer milestones into authoritative, high-impact LinkedIn content.";
    let pageKeywords = "LinkedIn Automation, B2B Content Creation, Developer Advocacy, GitHub Content Engine, Professional Brand Automation, AI Code Summarizer";
    let pagePath = `/${activeTab}`;

    if (activeTab === 'home') {
      pageTitle = isAr 
        ? "المستودعات | LinkedIn Authority Engine — أتمتة المحتوى المهني"
        : isDe
        ? "Repositories | LinkedIn Authority Engine — B2B Content-Automatisierung"
        : "Repositories | LinkedIn Authority Engine — Professional B2B Content Automation";
      pageDesc = isAr
        ? "تصفح مستودعات GitHub الخاصة بك وقم بتحليل الشيفرات البرمجية لتوليد منشورات LinkedIn مهنية غنية بالمعلومات."
        : isDe
        ? "Durchsuchen Sie Ihre GitHub-Repositories und analysieren Sie Codebasen, um professionelle LinkedIn-Beiträge zu generieren."
        : "Browse your GitHub repositories and analyze codebase structures to synthesize top-tier professional LinkedIn status updates.";
    } else if (activeTab === 'templates') {
      pageTitle = isAr
        ? "قوالب منشورات LinkedIn الاحترافية | LinkedIn Authority Engine"
        : isDe
        ? "Beitragsvorlagen | LinkedIn Authority Engine"
        : "LinkedIn B2B Post Templates | LinkedIn Authority Engine";
    } else if (activeTab === 'settings') {
      pageTitle = isAr
        ? "الإعدادات ومنطقة الخصوصية | Authority Engine"
        : isDe
        ? "Einstellungen & Datenschutzbereich | Authority Engine"
        : "Settings & GDPR Enclave | Authority Engine";
    }

    updatePageMetadata({
      title: pageTitle,
      description: pageDesc,
      keywords: pageKeywords,
      path: pagePath,
      lang: lang
    });

    injectJSONLD(SchemaTemplates.getSoftwareApplicationSchema(lang));
  }, [activeTab, lang]);





  
  const refreshRepos = async (forceClearCache = false) => {
    if (!settings.githubUsername) return;
    setLoadingRepos(true);
    try {


      const list = await fetchRepos(settings.githubUsername, settings.githubToken, orgFilter);
      setRepos(list);
      
      const orgList = await fetchOrgs(settings.githubUsername, settings.githubToken);
      setOrgs(orgList);
    } catch (err) {
      console.error("Failed to fetch live repos:", err);
      if (forceClearCache) setRepos([]);
    } finally {
      setLoadingRepos(false);
    }
  };

  // Load repositories whenever GitHub Username, Token or demoMode changes
  useEffect(() => {
    if (!settings.githubUsername) {
      setRepos([]);
      return;
    }
    refreshRepos();
  }, [settings.githubUsername, settings.githubToken, orgFilter]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings(inputs.ghUsernameInput, inputs.ghTokenInput, inputs.liTokenInput);
      showToast(lang === 'ar' ? "تم حفظ الإعدادات وربط القنوات بنجاح! ✓" : "Settings saved and channels linked! ✓");
    } catch(err) {
      console.error(err);
      showToast(lang === 'ar' ? "حدث خطأ أثناء حفظ الإعدادات" : "Failed to save settings");
    }
  };


  const handleDisconnect = async (platform: 'github' | 'linkedin') => {
    try {
      await disconnectChannel(platform);
      showToast(lang === 'ar' ? "تم فصل القناة المحددة بنجاح ✓" : "Channel disconnected successfully ✓");
    } catch(e) {
      showToast(lang === 'ar' ? "حدث خطأ" : "An error occurred");
    }
  };

  // Deep Scan codebase to generate premium draft







  // Generate hashtags for the current post text
  const handleGenerateHashtags = async (text: string, currentLang: string) => {
    if (!text || !user) return;
    setIsGeneratingTags(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/generate-hashtags", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ text, lang: currentLang })
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedTags(data.hashtags || []);
        showToast(lang === 'ar' ? "تم توليد الهاشتاغات الذكية المقترحة بنجاح! ✨" : "Smart hashtags optimized successfully! ✨");
      } else {
        const err = await res.json();
        throw new Error(err.error || "AI hashtag generation failed");
      }
    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? "حدث خطأ" : "An error occurred");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  // Append tags to the active post draft
  const handleAppendHashtags = async (tags: string[]) => {
    if (!activePostId) return;
    const currentPost = posts.find(p => p.id === activePostId);
    if (!currentPost) return;
    const tagsStr = "\n\n" + tags.join(" ");
    const newText = currentPost.text + tagsStr;
    await updatePostText(activePostId, newText);
    showToast(lang === 'ar' ? "تمت إضافة الهاشتاغات المقترحة للبوست الحالي ✓" : "Hashtags appended to active post ✓");
  };

  // Append tags to all available drafts helper
  const handleAppendToAllDrafts = async (tags: string[]) => {
    const drafts = posts.filter(p => p.status === 'draft' || p.status === 'failed');
    if (drafts.length === 0) return;
    const tagsStr = "\n\n" + tags.join(" ");
    try {
      for (const d of drafts) {
        const postRef = doc(db, "users", user.uid, "posts", d.id);
        const newText = d.text + tagsStr;
        await updateDoc(postRef, { text: newText });
      }
      showToast(lang === 'ar' ? "تمت إضافة الهاشتاغات المقترحة لجميع المسودات ✓" : "Hashtags appended to all drafts ✓");
    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? "حدث خطأ" : "Error appending tags");
    }
  };









  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmMsg = lang === 'ar' 
      ? 'هل أنت متأكد من حذف حسابك بشكل نهائي؟ سيتم مسح جميع منشوراتك وإعداداتك نهائياً ولن تتمكن من التراجع عن هذا الإجراء.' 
      : lang === 'de'
      ? 'Sind Sie sicher, dass Sie Ihr Konto dauerhaft löschen möchten? Alle Daten gehen verloren.'
      : 'Are you sure you want to permanently delete your account? All your data will be lost.';
      
    if (!window.confirm(confirmMsg)) return;

    try {
      // 1. Delete all posts
      const postsRef = collection(db, "users", user.uid, "posts");
      const { getDocs } = await import('firebase/firestore');
      const postsSnap = await getDocs(postsRef);
      const deletePromises = postsSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // 2. Delete settings
      const settingsRef = doc(db, "users", user.uid, "settings", "current");
      await deleteDoc(settingsRef);

      // 3. Delete auth account
      await user.delete();
      showToast(lang === 'ar' ? 'تم حذف حسابك بنجاح.' : 'Account deleted successfully.');
      // After user.delete() onAuthStateChanged will fire and set user to null
    } catch (e: any) {
      console.error("Failed to delete account", e);
      if (e.code === 'auth/requires-recent-login') {
        alert(lang === 'ar' ? 'يرجى تسجيل الخروج وتسجيل الدخول مرة أخرى لإتمام عملية الحذف.' : 'Please sign out and sign in again to delete your account.');
      } else {
        showToast(lang === 'ar' ? 'حدث خطأ أثناء الحذف.' : 'Failed to delete account.');
      }
    }
  };

  const handleApplyPresetTime = (presetType: 'peak' | 'mid' | 'weekend') => {
    const now = new Date();
    // Wednesday peak 10:00 AM as a beautiful optimal default
    now.setDate(now.getDate() + (presetType === 'peak' ? 1 : presetType === 'mid' ? 2 : 4));
    
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = "10:00";
    setScheduleDate(formattedDate);
    setScheduleTime(formattedTime);
    showToast(t[lang].toastPresetApplied);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="relative w-16 h-16 flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-25 animate-pulse" />
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
        <p className="text-sm text-slate-400 font-bold tracking-wider animate-pulse uppercase">
          {lang === 'ar' ? 'جاري تحميل البوابة...' : 'Initializing Authority Engine...'}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <LandingPage 
        lang={lang} 
        onToggleLang={handleToggleLang} 
      />
    );
  }

  if (!loadingSettings && !isOnboardingComplete) {
    return (
      <OnboardingWizard lang={lang} />
    );
  }

  return (
    <div className="h-screen w-full bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      <Header 
        lang={lang} 
        settings={settings}
        onToggleLang={handleToggleLang} 
        onDisconnect={handleDisconnect}
      />
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row relative">
        <Sidebar 
          lang={lang}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'home') navigate('/repositories');
            else if (tab === 'settings') navigate('/settings');
            else if (tab === 'templates') navigate('/templates');
            else if (tab === 'drafts') navigate('/drafts');
            
            if (!['draft', 'scheduled', 'published'].includes(tab)) {
              setActivePostId(null);
            }
          }}
          posts={posts}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32 md:pb-8 flex flex-col">
          <Routes>
            <Route path="/" element={<Navigate to="/repositories" replace />} />
            
            <Route path="/settings" element={
              <div className="fade-in-element flex-1">
                <SettingsPanel 
                  lang={lang}
                  settings={settings}
                  handleDisconnect={handleDisconnect}
                  handleOpenLegal={(tab: 'privacy' | 'terms' | 'developer') => {
                    setLegalModalTab(tab);
                    setIsLegalModalOpen(true);
                  }}
                />
              </div>
            } />
            
            <Route path="/templates" element={
              <div className="fade-in-element flex-1 flex flex-col w-full h-full relative">
                <TemplatesPanel 
                  lang={lang}
                  posts={posts}
                  handleUseTemplate={async () => {}}
                  handleDeletePost={async () => {}}
                  setActiveTab={() => {}}
                  showToast={showToast}
                />
              </div>
            } />
            
            <Route path="/drafts" element={
              <div className="fade-in-element flex-1 flex flex-col w-full h-full">
                <DraftsDashboard lang={lang} />
              </div>
            } />
            
            <Route path="/repositories" element={
              <div className="fade-in-element flex-1 flex flex-col w-full h-full">
                <RepositoriesDashboard 
                  lang={lang}
                  repos={repos}
                  loadingRepos={loadingRepos}
                  orgFilter={orgFilter}
                  setOrgFilter={setOrgFilter}
                  orgs={orgs}
                  repoSearch={repoSearch}
                  setRepoSearch={setRepoSearch}
                  selectedRepo={selectedRepo}
                  setSelectedRepo={setSelectedRepo}
                  selectedTemplate={selectedTemplate}
                  setSelectedTemplate={setSelectedTemplate}
                  refreshRepos={refreshRepos}
                  githubProfile={settings.githubProfile}
                  settings={settings}
                  posts={posts}
                />
              </div>
            } />

            <Route path="/repositories/:owner/:repo" element={
              <div className="fade-in-element flex-1 flex flex-col w-full h-full">
                <RepoDetails 
                  lang={lang}
                  settings={settings}
                  demoMode={demoMode}
                />
              </div>
            } />
          </Routes>
        </main>
      </div>
      <MobileNav 
        lang={lang}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'home') navigate('/repositories');
          else if (tab === 'settings') navigate('/settings');
          else if (tab === 'templates') navigate('/templates');
          else if (tab === 'drafts') navigate('/drafts');
        }}
        posts={posts}
      />
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900 border border-indigo-500/30 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-350 select-none">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
          <span className="text-sm font-medium text-white">{toast.message}</span>
        </div>
      )}
      <FloatingHelpWidget lang={lang} />
      <LegalModal 
        lang={lang}
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
      <AboutUsModal
        lang={lang}
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
      <footer className="h-10 bg-slate-950 border-t border-white/5 text-[9px] px-4 md:px-6 flex items-center justify-between text-slate-500 shrink-0 z-10 select-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setIsAboutModalOpen(true)} className="hover:text-indigo-400 font-bold text-indigo-500/80 transition-colors">{isAr ? 'عن المنصة' : 'About'}</button>
          <span>•</span>
          <button onClick={() => { setIsLegalModalOpen(true); setLegalModalTab('privacy'); }} className="hover:text-indigo-400 transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy'}</button>
          <span>•</span>
          <button onClick={() => { setIsLegalModalOpen(true); setLegalModalTab('terms'); }} className="hover:text-indigo-400 transition-colors">{isAr ? 'شروط الاستخدام' : 'Terms'}</button>
          <span>•</span>
          <button onClick={() => { setIsLegalModalOpen(true); setLegalModalTab('developer'); }} className="hover:text-indigo-400 transition-colors">{isAr ? 'المطور' : 'Developer'}</button>
        </div>
        <div className="hidden sm:block">LinkedIn Authority Engine • v2.1</div>
      </footer>
    </div>
  );
};

export default function AppWithAuth() {
  return (
    <Router>
      <App />
    </Router>
  );
}

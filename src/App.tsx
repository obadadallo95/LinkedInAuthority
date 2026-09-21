import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './application/AuthContext';
import { useSettings } from './contexts/SettingsContext';
import { usePosts } from './contexts/PostsContext';

const Sidebar = lazy(() => import('./components/Layout/Sidebar').then(module => ({ default: module.Sidebar })));
const MobileNav = lazy(() => import('./components/Layout/MobileNav').then(module => ({ default: module.MobileNav })));
const Header = lazy(() => import('./components/Layout/Header').then(module => ({ default: module.Header })));
const RepositoriesDashboard = lazy(() => import('./components/RepositoriesDashboard').then(module => ({ default: module.RepositoriesDashboard })));
const RepoDetails = lazy(() => import('./components/RepoDetails').then(module => ({ default: module.RepoDetails })));
const DraftsDashboard = lazy(() => import('./components/DraftsDashboard').then(module => ({ default: module.DraftsDashboard })));
const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(module => ({ default: module.SettingsPanel })));
const AutomationsDashboard = lazy(() => import('./components/AutomationsDashboard').then(module => ({ default: module.AutomationsDashboard })));
const LegalModal = lazy(() => import('./components/Layout/LegalModal').then(module => ({ default: module.LegalModal })));
const FloatingHelpWidget = lazy(() => import('./components/FloatingHelpWidget').then(module => ({ default: module.FloatingHelpWidget })));
const AboutUsModal = lazy(() => import('./components/Layout/AboutUsModal').then(module => ({ default: module.AboutUsModal })));
const TemplatesPanel = lazy(() => import('./components/TemplatesPanel').then(module => ({ default: module.TemplatesPanel })));
const PwaPrompt = lazy(() => import('./components/shared/PwaPrompt').then(module => ({ default: module.PwaPrompt })));
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const OnboardingWizard = lazy(() => import('./pages/OnboardingWizard').then(module => ({ default: module.OnboardingWizard })));
import { t } from './locales';
import { updatePageMetadata, injectJSONLD, SchemaTemplates } from './utils/MetadataUtils';
import { isBrowserE2E } from './utils/e2e';

import { RefreshCw } from 'lucide-react';

const AUTHENTICATED_DEMO_REPOSITORIES = [
  {
    id: 'demo-authority-fixture',
    name: 'authority-fixture',
    full_name: 'demo-developer/authority-fixture',
    owner: { login: 'demo-developer' },
    description: 'A local evidence-first repository fixture for exploring the draft workflow.',
    language: 'TypeScript',
    updated_at: '2026-09-20T12:00:00Z',
    stargazers_count: 12,
    size: 640,
  },
];

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
  const [toast, setToast] = useState({ show: false, message: "" });


  const { posts, postsError, deletePost, useTemplate } = usePosts();

  const location = useLocation();
  const navigate = useNavigate();

  // Infer activeTab from location path
  const currentPath = location.pathname;
  let activeTab: 'home' | 'drafts' | 'templates' | 'settings' | 'automations' = 'home';
  if (currentPath.startsWith('/settings')) activeTab = 'settings';
  else if (currentPath.startsWith('/templates')) activeTab = 'templates';
  else if (currentPath.startsWith('/drafts')) activeTab = 'drafts';
  else if (currentPath.startsWith('/automations')) activeTab = 'automations';


  const { settings, loadingSettings, settingsError, disconnectChannel, isOnboardingComplete } = useSettings();

  // Repositories state
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [reposLoadError, setReposLoadError] = useState<string | null>(null);
  const [orgFilter, setOrgFilter] = useState<string>('Personal');
  const [orgs, setOrgs] = useState<any[]>([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  // Generator Modal state
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'developer'>('privacy');

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
    
    let pageTitle = "LinkedIn Authority Engine | Evidence-backed technical drafts";
    let pageDesc = "Turn meaningful GitHub work into editable, evidence-backed LinkedIn drafts for human review and manual copying.";
    let pageKeywords = "Evidence-backed drafts, B2B technical content, Developer Advocacy, GitHub project intelligence, AI code analysis";
    const pagePath = activeTab === 'home' ? '/repositories' : `/${activeTab}`;

    if (activeTab === 'home') {
      pageTitle = t[lang].metaTitleHome;
      pageDesc = t[lang].metaDescHome;
    } else if (activeTab === 'templates') {
      pageTitle = t[lang].metaTitleTemplates;
    } else if (activeTab === 'settings') {
      pageTitle = t[lang].metaTitleSettings;
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
    if (demoMode) {
      setRepos(AUTHENTICATED_DEMO_REPOSITORIES);
      setOrgs([]);
      setReposLoadError(null);
      setLoadingRepos(false);
      return;
    }
    if (!settings.githubUsername) return;
    setLoadingRepos(true);
    setReposLoadError(null);
    try {
      if (isBrowserE2E) {
        setRepos([{ id: 'e2e-authority-fixture', name: 'authority-fixture', full_name: 'e2e-user/authority-fixture', owner: { login: 'e2e-user' }, description: 'A fixture repository for authenticated browser testing.', language: 'TypeScript', updated_at: '2026-09-20T12:00:00Z', stargazers_count: 7 }]);
        setOrgs([]);
        return;
      }


      const idToken = user && typeof user.getIdToken === 'function' ? await user.getIdToken() : '';
      if (!idToken) {
        // Protected repository access must stay server-backed. Never fall back
        // to browser-side GitHub requests when the Firebase token is missing.
        throw new Error('Authentication token unavailable for GitHub access');
      }
      const authHeaders = { Authorization: `Bearer ${idToken}` };
      const [reposResponse, orgsResponse] = await Promise.all([
        fetch(`/api/integrations/github/repos?username=${encodeURIComponent(settings.githubUsername)}`, { headers: authHeaders }),
        fetch(`/api/integrations/github/orgs?username=${encodeURIComponent(settings.githubUsername)}`, { headers: authHeaders }),
      ]);
      if (!reposResponse.ok || !orgsResponse.ok) {
        const failedResponse = !reposResponse.ok ? reposResponse : orgsResponse;
        let serverMessage = '';
        try {
          const payload = await failedResponse.json();
          serverMessage = typeof payload?.error === 'string' ? payload.error : '';
        } catch {
          // Keep the client-side fallback below when the response is not JSON.
        }
        throw new Error(serverMessage || `GitHub data unavailable (${failedResponse.status})`);
      }
      setRepos(await reposResponse.json().then((data) => data.repos || []));
      setOrgs(await orgsResponse.json().then((data) => data.orgs || []));
    } catch (err) {
      console.error("Failed to fetch live repos:", err);
      setReposLoadError(err instanceof Error ? err.message : 'GitHub data unavailable');
      if (forceClearCache) setRepos([]);
    } finally {
      setLoadingRepos(false);
    }
  };

  // Load repositories whenever the server-managed GitHub connection changes.
  useEffect(() => {
    if (demoMode) {
      setRepos(AUTHENTICATED_DEMO_REPOSITORIES);
      setOrgs([]);
      setReposLoadError(null);
      setLoadingRepos(false);
      return;
    }
    if (!settings.githubUsername) {
      setRepos(demoMode ? AUTHENTICATED_DEMO_REPOSITORIES : []);
      setOrgs([]);
      return;
    }
    refreshRepos();
  }, [settings.githubUsername, orgFilter, user?.uid, demoMode]);

  const handleDisconnect = async (platform: 'github') => {
    try {
      await disconnectChannel(platform);
      showToast(t[lang].toastDisconnectSuccess);
    } catch(e) {
      showToast(t[lang].toastDisconnectError);
    }
  };

  // Deep Scan codebase to generate premium draft















  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmMsg = t[lang].confirmDeleteAccount;
      
    if (!window.confirm(confirmMsg)) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!response.ok) throw new Error('Account deletion endpoint failed');
      await signOut();
      showToast(t[lang].toastAccountDeleted);
      // After user.delete() onAuthStateChanged will fire and set user to null
    } catch (e: any) {
      console.error("Failed to delete account", e);
      if (e.code === 'auth/requires-recent-login') {
        showToast(t[lang].toastAccountDeleteRelogin);
      } else {
        showToast(t[lang].toastAccountDeleteError);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="relative w-16 h-16 flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-25 animate-pulse" />
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
        <p className="text-sm text-slate-400 font-bold tracking-wider animate-pulse uppercase">
          {t[lang].loadingEngine}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<RouteLoading />}>
        <>
          <LandingPage lang={lang} onToggleLang={handleToggleLang} />
          <PwaPrompt lang={lang} />
        </>
      </Suspense>
    );
  }

  if (settingsError) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 text-center" role="alert">
          <RefreshCw className="mx-auto mb-5 h-10 w-10 text-amber-400" />
          <h1 className="mb-3 text-xl font-bold">
            {lang === 'ar' ? 'تعذر تحميل إعدادات الحساب' : lang === 'de' ? 'Kontoeinstellungen konnten nicht geladen werden' : 'Account settings could not be loaded'}
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-slate-400">
            {lang === 'ar'
              ? 'لم يتم تغيير بياناتك. تحقق من الاتصال ثم أعد المحاولة.'
              : lang === 'de'
                ? 'Deine Daten wurden nicht geändert. Prüfe die Verbindung und versuche es erneut.'
                : 'Your data was not changed. Check the connection and try again.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500"
          >
            <RefreshCw className="h-4 w-4" />
            {lang === 'ar' ? 'إعادة المحاولة' : lang === 'de' ? 'Erneut versuchen' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  if (!loadingSettings && !isOnboardingComplete) {
    return (
      <Suspense fallback={<RouteLoading />}>
        <OnboardingWizard lang={lang} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<RouteLoading />}>
    <div className="h-screen w-full bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      <PwaPrompt lang={lang} />
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
            else if (tab === 'automations') navigate('/automations');
            
          }}
          posts={posts}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32 md:pb-8 flex flex-col">
          <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<Navigate to="/repositories" replace />} />
            
            <Route path="/settings" element={
              <div className="fade-in-element flex-1">
                <SettingsPanel 
                  lang={lang}
                  settings={settings}
                  handleDisconnect={handleDisconnect}
                  handleDeleteAccount={handleDeleteAccount}
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
                  postsError={postsError}
                  handleUseTemplate={async (template) => {
                    await useTemplate(template);
                    showToast(lang === 'ar' ? 'تم إنشاء مسودة من القالب.' : lang === 'de' ? 'Entwurf aus Vorlage erstellt.' : 'Draft created from template.');
                  }}
                  handleDeletePost={deletePost}
                  setActiveTab={(tab) => {
                    if (tab === 'drafts') navigate('/drafts');
                  }}
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
                  reposLoadError={reposLoadError}
                  orgFilter={orgFilter}
                  setOrgFilter={setOrgFilter}
                  orgs={orgs}
                  repoSearch={repoSearch}
                  setRepoSearch={setRepoSearch}
                  refreshRepos={refreshRepos}
                  demoMode={demoMode}
                  setDemoMode={setDemoMode}
                  githubProfile={settings.githubProfile}
                  settings={settings}
                  posts={posts}
                />
              </div>
            } />

            <Route path="/automations" element={
              <div className="fade-in-element flex-1 flex flex-col w-full h-full">
                <AutomationsDashboard lang={lang} repos={repos} />
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

            <Route path="*" element={<RouteNotFound lang={lang} onGoHome={() => navigate('/repositories')} />} />
          </Routes>
          </Suspense>
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
          else if (tab === 'automations') navigate('/automations');
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
          <button onClick={() => setIsAboutModalOpen(true)} className="hover:text-indigo-400 font-bold text-indigo-500/80 transition-colors">{t[lang].footerAbout}</button>
          <span>•</span>
          <button onClick={() => { setIsLegalModalOpen(true); setLegalModalTab('privacy'); }} className="hover:text-indigo-400 transition-colors">{t[lang].footerPrivacy}</button>
          <span>•</span>
          <button onClick={() => { setIsLegalModalOpen(true); setLegalModalTab('terms'); }} className="hover:text-indigo-400 transition-colors">{t[lang].footerTerms}</button>
          <span>•</span>
          <button onClick={() => { setIsLegalModalOpen(true); setLegalModalTab('developer'); }} className="hover:text-indigo-400 transition-colors">{t[lang].footerDeveloper}</button>
        </div>
        <div className="hidden sm:block">LinkedIn Authority Engine • v2.1</div>
      </footer>
    </div>
    </Suspense>
  );
};

export default function AppWithAuth() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function RouteLoading() {
  return (
    <div className="flex-1 flex items-center justify-center text-slate-400" role="status">
      <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
    </div>
  );
}

function RouteNotFound({ lang, onGoHome }: { lang: 'ar' | 'en' | 'de'; onGoHome: () => void }) {
  const copy = {
    ar: {
      title: 'هذه الصفحة غير موجودة',
      body: 'يمكنك العودة إلى المستودعات لمتابعة بناء مسودة موثّقة.',
      action: 'العودة إلى المستودعات',
    },
    de: {
      title: 'Diese Seite wurde nicht gefunden',
      body: 'Kehre zu den Repositories zurück, um einen belegten Entwurf zu erstellen.',
      action: 'Zu den Repositories',
    },
    en: {
      title: 'This page could not be found',
      body: 'Return to repositories to continue building an evidence-backed draft.',
      action: 'Back to repositories',
    },
  }[lang];

  return (
    <section className="flex min-h-[22rem] flex-1 items-center justify-center p-6" aria-labelledby="route-not-found-title">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-indigo-300">404</p>
        <h1 id="route-not-found-title" className="mb-3 text-2xl font-bold text-white">{copy.title}</h1>
        <p className="mb-7 text-sm leading-7 text-slate-400">{copy.body}</p>
        <button
          type="button"
          onClick={onGoHome}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {copy.action}
        </button>
      </div>
    </section>
  );
}

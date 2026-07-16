import React, { useState, useEffect } from 'react';
import { Sparkles, Search, GitBranch, RefreshCw, FolderGit2, Star, Calendar, Database, GitCommit, ChevronDown, FileText, CheckSquare, Square, X, ChevronRight, ChevronDown as ChevronDownIcon, Check } from 'lucide-react';
import { t } from '../constants';
import { RepoSparkline } from './RepoSparkline';
import { fetchReadme as githubFetchReadme } from '../services/githubService';
import { motion, AnimatePresence } from 'motion/react';

const templateDescriptions: Record<string, { title: string; desc: Record<'en' | 'ar' | 'de', string> }> = {
  general: {
    title: 'Engineering Story',
    desc: {
      en: 'Focuses on the high-level engineering journey, problem-solving, and the value brought by the project.',
      ar: 'يركز على الرحلة الهندسية عالية المستوى، وحل المشكلات، والقيمة التي يضيفها المشروع.',
      de: 'Konzentriert sich auf die allgemeine technische Reise, Problemlösung und den Mehrwert des Projekts.'
    }
  },
  technical: {
    title: 'Architectural Deep Dive',
    desc: {
      en: 'Detailed breakdown of the architecture, tech stack, and design patterns used.',
      ar: 'تفصيل معماري دقيق، التقنيات المستخدمة، وأنماط التصميم.',
      de: 'Detaillierte Aufschlüsselung der Architektur, des Tech-Stacks und der verwendeten Entwurfsmuster.'
    }
  },
  executive: {
    title: 'Summary & Impact',
    desc: {
      en: 'High-level summary of the repository focusing on metrics, impact, and business value.',
      ar: 'ملخص عالي المستوى للمستودع يركز على المقاييس والتأثير وقيمة الأعمال.',
      de: 'Zusammenfassung des Repositorys mit Fokus auf Metriken, Auswirkungen und Geschäftswert.'
    }
  }
};

export const RepositoriesDashboard = ({
  lang,
  repos,
  loadingRepos,
  repoSearch,
  setRepoSearch,
  selectedRepo,
  setSelectedRepo,
  selectedTemplate,
  setSelectedTemplate,
  handleAnalyzeRepo,
  analyzingRepo,
  settings,
  setActiveTab,
  refreshRepos,
  orgFilter,
  setOrgFilter,
  orgs,
  demoMode,
  setDemoMode
}: any) => {
  const isAr = lang === 'ar';
  
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'stars'>('date');
  const [commits, setCommits] = useState<Record<string, any[]>>({});
  const [branches, setBranches] = useState<Record<string, any[]>>({});
  const [selectedBranches, setSelectedBranches] = useState<Record<string, string>>({});
  
  const [loadingCommitsFor, setLoadingCommitsFor] = useState<string | null>(null);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [showTooltip, setShowTooltip] = useState(() => localStorage.getItem('hide_repo_tooltip') !== 'true');
  const [recentRepos, setRecentRepos] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recent_repos') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (selectedRepo) {
      setRecentRepos(prev => {
        const updated = [selectedRepo, ...prev.filter(r => r !== selectedRepo)].slice(0, 5);
        localStorage.setItem('recent_repos', JSON.stringify(updated));
        return updated;
      });
    }
  }, [selectedRepo]);

  const getStatusDot = (updated_at: string) => {
    const days = (new Date().getTime() - new Date(updated_at).getTime()) / (1000 * 3600 * 24);
    if (days <= 7) return "bg-green-500";
    if (days <= 30) return "bg-yellow-500";
    return "bg-slate-600";
  };
  
  // Bulk selection
  const [checkedRepos, setCheckedRepos] = useState<Set<string>>(new Set());
  
  // Long press selection states
  const [isLongPressed, setIsLongPressed] = useState(false);
  const [longPressTimeoutId, setLongPressTimeoutId] = useState<any>(null);

  const startLongPress = (repoName: string) => {
    setIsLongPressed(false);
    const id = setTimeout(() => {
      const newChecked = new Set(checkedRepos);
      if (newChecked.has(repoName)) {
        newChecked.delete(repoName);
      } else {
        newChecked.add(repoName);
      }
      setCheckedRepos(newChecked);
      setIsLongPressed(true);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch (_) {}
      }
    }, 600);
    setLongPressTimeoutId(id);
  };

  const cancelLongPress = () => {
    if (longPressTimeoutId) {
      clearTimeout(longPressTimeoutId);
      setLongPressTimeoutId(null);
    }
    setTimeout(() => {
      setIsLongPressed(false);
    }, 150);
  };
  
  // Readme modal
  const [readmeModalOpen, setReadmeModalOpen] = useState(false);
  const [readmeContent, setReadmeContent] = useState('');
  const [loadingReadme, setLoadingReadme] = useState(false);

  // Readme live previews inside card
  const [readmePreviews, setReadmePreviews] = useState<Record<string, string>>({});
  const [loadingReadmePreview, setLoadingReadmePreview] = useState<Record<string, boolean>>({});

  const toggleRepoCheck = (repoName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newChecked = new Set(checkedRepos);
    if (newChecked.has(repoName)) {
      newChecked.delete(repoName);
    } else {
      newChecked.add(repoName);
    }
    setCheckedRepos(newChecked);
  };

  const toggleAll = () => {
    if (checkedRepos.size === sortedRepos.length && sortedRepos.length > 0) {
      setCheckedRepos(new Set());
    } else {
      setCheckedRepos(new Set(sortedRepos.map((r: any) => r.name)));
    }
  };

  const handleBatchAnalyze = () => {
    if (checkedRepos.size > 0) {
      // For batch, we just use the selected branch of each repo or main
      handleAnalyzeRepo(Array.from(checkedRepos), 'main'); // simplify batch branch to main for now
    }
  };

  const fetchReadme = async (repoName: string) => {
    setReadmeModalOpen(true);
    setLoadingReadme(true);
    setReadmeContent('');
    try {
      const repo = repos.find((r: any) => r.name === repoName);
      const isFallback = demoMode || !!repo?.isFallback;
      const text = await githubFetchReadme(
        settings.githubUsername || 'demo-developer',
        repoName,
        settings.githubToken,
        isFallback
      );
      setReadmeContent(text);
    } catch (e) {
      setReadmeContent('Error loading README.');
    } finally {
      setLoadingReadme(false);
    }
  };

  // Sorting logic
  const sortedRepos = React.useMemo(() => {
    let filtered = repos.filter((r: any) => r.name.toLowerCase().includes(repoSearch.toLowerCase()));
    
    return filtered.sort((a: any, b: any) => {
      if (sortBy === 'date') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'stars') {
        return b.stargazers_count - a.stargazers_count;
      }
      return 0;
    });
  }, [repos, repoSearch, sortBy]);

  const toggleRepoExpand = (repoName: string) => {
    if (selectedRepo === repoName) {
      setSelectedRepo(''); // collapse
    } else {
      setSelectedRepo(repoName);
      loadRepoDetails(repoName);
    }
  };

  const loadRepoDetails = (repoName: string) => {
    // Unconditionally fetch README preview if not loaded
    if (!readmePreviews[repoName]) {
      const repo = repos.find((r: any) => r.name === repoName);
      const isFallback = demoMode || !!repo?.isFallback;
      setLoadingReadmePreview(prev => ({ ...prev, [repoName]: true }));
      githubFetchReadme(
        settings.githubUsername || 'demo-developer',
        repoName,
        settings.githubToken,
        isFallback
      ).then(text => {
        setReadmePreviews(prev => ({ ...prev, [repoName]: text }));
      }).catch(() => {
        setReadmePreviews(prev => ({ ...prev, [repoName]: '' }));
      }).finally(() => {
        setLoadingReadmePreview(prev => ({ ...prev, [repoName]: false }));
      });
    }

    if (commits[repoName]) return; // already loaded commits

    if (demoMode) {
      setCommits(prev => ({
        ...prev,
        [repoName]: [
          { commit: { message: "refactor: optimize rendering pipeline & caching loops", author: { date: new Date().toISOString() } } },
          { commit: { message: "feat: add secure credential validation and logs", author: { date: new Date(Date.now() - 86400000).toISOString() } } },
          { commit: { message: "initial release", author: { date: new Date(Date.now() - 172800000).toISOString() } } }
        ]
      }));
      setBranches(prev => ({
        ...prev,
        [repoName]: [{ name: "main" }, { name: "dev" }]
      }));
      setSelectedBranches(prev => ({ ...prev, [repoName]: "main" }));
      return;
    }

    if (!settings.githubUsername) return;

    setLoadingCommitsFor(repoName);
    
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (settings.githubToken) {
      headers.Authorization = `token ${settings.githubToken}`;
    }

    // Fetch Commits
    fetch(`https://api.github.com/repos/${settings.githubUsername}/${repoName}/commits?per_page=3`, { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setCommits(prev => ({ ...prev, [repoName]: Array.isArray(data) ? data : [] }));
      })
      .catch(() => setCommits(prev => ({ ...prev, [repoName]: [] })));
      
    // Fetch Branches
    fetch(`https://api.github.com/repos/${settings.githubUsername}/${repoName}/branches`, { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setBranches(prev => ({ ...prev, [repoName]: data }));
          const mainOrMaster = data.find(b => b.name === 'main' || b.name === 'master');
          if (mainOrMaster) {
             setSelectedBranches(prev => ({ ...prev, [repoName]: mainOrMaster.name }));
          } else if (data.length > 0) {
             setSelectedBranches(prev => ({ ...prev, [repoName]: data[0].name }));
          } else {
             setSelectedBranches(prev => ({ ...prev, [repoName]: 'main' }));
          }
        }
      })
      .catch(() => setBranches(prev => ({ ...prev, [repoName]: [] })))
      .finally(() => setLoadingCommitsFor(null));
  };

  // Simulate progress indicator stages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (analyzingRepo) {
      setAnalysisStage(0);
      let step = 0;
      interval = setInterval(() => {
        step++;
        if (step < 3) {
          setAnalysisStage(step);
        }
      }, 2500);
    } else {
      setAnalysisStage(0);
    }
    return () => clearInterval(interval);
  }, [analyzingRepo]);

  const progressStages = [
    isAr ? 'يتم استنساخ المستودع...' : 'Cloning Repository...',
    isAr ? 'يتم تحليل الكود...' : 'Parsing Source Code...',
    isAr ? 'يتم توليد المحتوى...' : 'AI Drafting in Progress...'
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 md:gap-7">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                <FolderGit2 className="w-6 h-6 md:w-7 md:h-7 text-indigo-400" />
                <span>{isAr ? 'مستودعات جيتهاب' : 'GitHub Repositories'}</span>
              </h2>
              {settings.githubUsername && (
                <button
                  onClick={() => {
                    if (refreshRepos) refreshRepos(true);
                    setCommits({});
                    setBranches({});
                    setCheckedRepos(new Set());
                    setRepoSearch('');
                  }}
                  disabled={loadingRepos}
                  className="p-1.5 bg-slate-900 border border-white/10 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
                  title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingRepos ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-1 mb-3">
              {isAr ? 'اختر مستودعاً لتحليله وتوليد منشورات احترافية للينكد إن.' : 'Select repositories to analyze and generate professional LinkedIn posts.'}
            </p>
          </div>
          
          {/* Batch Actions */}
          {checkedRepos.size > 0 && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                {checkedRepos.size} {isAr ? 'محددة' : 'selected'}
              </span>
              <button
                onClick={handleBatchAnalyze}
                disabled={analyzingRepo}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {analyzingRepo ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {isAr ? 'تحليل جماعي' : 'Batch Analyze'}
              </button>
            </div>
          )}
        </div>

        {/* Filters and List */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl shadow-xl shadow-slate-900/50 flex flex-col overflow-hidden">
          {!settings.githubUsername && !demoMode ? (
            <div className="m-auto text-center p-6 max-w-sm space-y-4">
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                {isAr 
                  ? 'يرجى ربط حساب GitHub أولاً من الإعدادات لاستعراض مستودعاتك، أو تفعيل الوضع التجريبي لاستكشاف عينات جاهزة.' 
                  : 'Please connect your GitHub account in Settings to browse repositories, or enable Demo Mode to explore sandbox repositories.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-white/5 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isAr ? 'الذهاب للإعدادات' : 'Go to Settings'}
                </button>
                <button
                  onClick={() => {
                    if (setDemoMode) setDemoMode(true);
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl border border-indigo-500/20 uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {isAr ? 'تفعيل الوضع التجريبي' : 'Enable Demo Mode'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Toolbar */}
              <div className="relative">
                {showTooltip && (
                  <div className="absolute -top-10 right-4 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-indigo-500/20 z-10 animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    {isAr ? 'استخدم البحث والفلترة لايجاد مستودعاتك' : 'Use search and filters to find repos'}
                    <button onClick={() => { setShowTooltip(false); localStorage.setItem('hide_repo_tooltip', 'true'); }} className="ml-1 opacity-70 hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute -bottom-1 right-4 w-2 h-2 bg-indigo-500 rotate-45" />
                  </div>
                )}
                <div className="repositories-dashboard-header p-3 md:p-4 border-b border-white/5 bg-slate-900/50 flex flex-col gap-3">
                  <div className="relative w-full">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${repoSearch ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder={isAr ? 'البحث في المستودعات...' : 'Search repositories...'}
                      className={`w-full bg-slate-950 border rounded-lg py-2.5 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                        repoSearch ? 'border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'border-white/5 focus:border-indigo-500'
                      } ${isAr ? 'pr-3 pl-9' : 'pl-9 pr-3'}`}
                    />
                    {repoSearch && (
                      <button onClick={() => setRepoSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                         <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full py-1 flex-wrap">
                    {/* Sort Dropdown */}
                    <div className="relative shrink-0">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className={`bg-slate-950/80 border rounded-full py-1.5 pl-3.5 pr-8 text-xs font-semibold tracking-wide transition-all cursor-pointer outline-none appearance-none ${
                          sortBy !== 'date'
                            ? 'border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                            : 'border-white/10 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <option value="date">{isAr ? 'الأحدث' : 'Sort: Latest'}</option>
                        <option value="stars">{isAr ? 'النجوم' : 'Sort: Stars'}</option>
                        <option value="name">{isAr ? 'الاسم' : 'Sort: Name'}</option>
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors ${sortBy !== 'date' ? 'text-indigo-400' : 'text-slate-500'}`} />
                    </div>

                    {/* Organization Filter Dropdown */}
                    {(settings.githubUsername || demoMode) && orgs && orgs.length > 0 && (
                      <div className="relative shrink-0 animate-in fade-in zoom-in-95 duration-200">
                        <select
                          value={orgFilter}
                          onChange={(e) => {
                            if (setOrgFilter) setOrgFilter(e.target.value);
                          }}
                          className={`bg-slate-950/80 border rounded-full py-1.5 pl-3.5 pr-8 text-xs font-semibold tracking-wide transition-all cursor-pointer outline-none appearance-none ${
                            orgFilter !== 'Personal'
                              ? 'border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                              : 'border-white/10 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <option value="Personal">{isAr ? 'الحساب الشخصي' : 'Personal Repos'}</option>
                          {orgs.map((org: any) => (
                            <option key={org.login} value={org.login}>
                              {org.login}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors ${orgFilter !== 'Personal' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      </div>
                    )}

                    {/* Demo Mode Toggle */}
                    <div className="flex items-center gap-2 bg-slate-950/60 px-3.5 py-1.5 rounded-full border border-white/5 select-none text-[10px] font-bold">
                      <span className="text-slate-400 uppercase tracking-wider">
                        {isAr ? 'الوضع التجريبي' : 'DEMO MODE'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (setDemoMode) setDemoMode(!demoMode);
                        }}
                        className={`relative inline-flex h-4.5 w-8.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          demoMode ? 'bg-indigo-600' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            demoMode ? (isAr ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
            </div>

              {/* Repositories Grid/List */}
              <div className="p-3 md:p-6 bg-slate-950/30">
                {repos.some((r: any) => r.isFallback) && (
                  <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <h5 className="text-xs font-bold text-amber-400">
                          {isAr ? 'تم تجاوز حد طلبات GitHub العام' : 'GitHub Rate Limit Reached'}
                        </h5>
                        <p className="text-[10.5px] text-slate-300 mt-1 leading-relaxed">
                          {isAr 
                            ? 'تنزيل المستودعات الحية بدون حساب مسجل يخضع لقيود شديدة على خوادم الاستضافة المشتركة. لتجاوز هذا القيود ورؤية مستودعاتك الحقيقية، يرجى ربط حساب GitHub بنقرة واحدة أو حفظ رمز وصول (PAT) في صفحة الإعدادات.' 
                            : 'Unauthenticated requests from shared hosting servers are rate-limited by GitHub. To bypass this restriction and see all your real public/private repositories, please link your GitHub account or save a Personal Access Token (PAT) in Settings.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="shrink-0 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-[10.5px] font-black transition-all cursor-pointer"
                    >
                      {isAr ? 'الذهاب للإعدادات ⚙️' : 'Go to Settings ⚙️'}
                    </button>
                  </div>
                )}

                {loadingRepos ? (
                  <div className="h-full flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                ) : sortedRepos.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm p-6 text-center">
                    <Search className="w-8 h-8 text-slate-700 mb-3" />
                    <p className="font-medium text-slate-400">{isAr ? 'لم يتم العثور على مستودعات.' : 'No repositories found.'}</p>
                    {repoSearch && (
                      <p className="text-xs mt-1">
                        {isAr ? 'جرب البحث بكلمات أخرى أو ' : 'Try adjusting your search query or '}
                        <button onClick={() => setRepoSearch('')} className="text-indigo-400 hover:underline">
                          {isAr ? 'مسح البحث' : 'clear search'}
                        </button>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {recentRepos.length > 0 && !repoSearch && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                          {isAr ? 'تم الوصول إليها مؤخراً' : 'Recently Accessed'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {recentRepos.map(repoName => {
                            const repo = repos.find((r: any) => r.name === repoName);
                            if (!repo) return null;
                            return (
                              <button
                                key={repoName}
                                onClick={() => {
                                  setSelectedRepo(repoName);
                                  document.getElementById(`repo-card-${repoName}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-lg text-xs text-slate-300 font-medium transition-colors flex items-center gap-1.5"
                              >
                                <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                                {repoName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1 mt-2">
                      {isAr ? 'جميع المستودعات' : 'All Repositories'}
                    </h4>
                    <div className="repositories-list-container grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {sortedRepos.map((repo: any) => {
                        const isExpanded = selectedRepo === repo.name;
                        const isChecked = checkedRepos.has(repo.name);
                        
                        return (
                          <div key={repo.id} id={`repo-card-${repo.name}`} className={`bg-slate-900 border rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'md:col-span-2 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-white/5 hover:border-white/10'} ${isChecked ? 'ring-1 ring-indigo-500/40 bg-indigo-950/5' : ''}`}>
                            
                            {/* Card Header (Always visible) */}
                            <div 
                              onClick={() => {
                                if (isLongPressed) {
                                  return;
                                }
                                toggleRepoExpand(repo.name);
                              }}
                              onMouseDown={() => startLongPress(repo.name)}
                              onMouseUp={cancelLongPress}
                              onMouseLeave={cancelLongPress}
                              onTouchStart={() => startLongPress(repo.name)}
                              onTouchEnd={cancelLongPress}
                              className={`p-2.5 md:p-3 flex items-center gap-3 cursor-pointer group select-none transition-colors duration-150 ${isChecked ? 'bg-indigo-950/20' : 'hover:bg-white/[0.02]'}`}
                            >
                              {/* Github Icon as selection trigger */}
                              <button 
                                onClick={(e) => toggleRepoCheck(repo.name, e)}
                                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 relative ${
                                  isChecked 
                                    ? 'bg-indigo-600/20 border border-indigo-500/60 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)] scale-105' 
                                    : 'bg-slate-950/80 border border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                                }`}
                                title={isAr ? (isChecked ? 'إلغاء تحديد المستودع' : 'تحديد المستودع') : (isChecked ? 'Deselect repository' : 'Select repository')}
                              >
                                {isChecked ? (
                                  <Check className="w-3.5 h-3.5 text-indigo-400 stroke-[3px] animate-in zoom-in-50 duration-150" />
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform group-hover:scale-110">
                                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                    <path d="M9 18c-4.51 2-5-2-7-2" />
                                  </svg>
                                )}
                                {isChecked && (
                                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full border border-slate-900 flex items-center justify-center">
                                    <div className="w-0.5 h-0.5 bg-white rounded-full" />
                                  </div>
                                )}
                              </button>
                              
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <GitBranch className="w-3 h-3 text-slate-500" />
                                  <h3 className="text-xs md:text-sm font-bold text-white truncate tracking-tight group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                                    {repo.name}
                                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(repo.updated_at)} shrink-0`} title="Activity Status" />
                                  </h3>
                                </div>
                                <p className="text-[10px] md:text-xs text-slate-400 line-clamp-1 mb-1">
                                  {repo.description || (isAr ? 'لا يوجد وصف' : 'No description provided')}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9px] md:text-[10px] font-medium text-slate-500 hidden md:flex">
                                  <span className="flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5" /> {repo.stargazers_count}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Database className="w-2.5 h-2.5" /> {Math.round(repo.size / 1024)}MB
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" /> {new Date(repo.updated_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                <div className="hidden sm:block">
                                  <RepoSparkline username={settings.githubUsername} repo={repo.name} token={settings.githubToken} />
                                </div>
                                <div className={`w-5 h-5 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                  <ChevronDownIcon className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>

                          {/* Expanded Details Section */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-white/5 bg-slate-950/50"
                              >
                                <div className="p-3 md:p-4 flex flex-col md:flex-row gap-4 md:gap-6">
                                  
                                  {/* Left: Metadata & Analysis Actions */}
                                  <div className="flex-1 flex flex-col gap-4">
                                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-lg border border-white/5">
                                      <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 uppercase font-bold">{isAr ? 'اللغة الأساسية' : 'Primary Lang'}</span>
                                        <span className="text-xs text-white font-medium">{repo.language || 'N/A'}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 uppercase font-bold">{isAr ? 'التفريعات' : 'Forks'}</span>
                                        <span className="text-xs text-white font-medium">{repo.forks_count || 0}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 uppercase font-bold">{isAr ? 'المشاكل المفتوحة' : 'Open Issues'}</span>
                                        <span className="text-xs text-white font-medium">{repo.open_issues_count || 0}</span>
                                      </div>
                                    </div>

                                    {/* README Excerpt */}
                                    <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5 flex flex-col gap-1.5">
                                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
                                        <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                        {isAr ? 'سياق README المباشر للمستودع' : 'Live README Context'}
                                      </h4>
                                      <div className="text-[11px] text-slate-300 leading-relaxed font-sans max-h-24 overflow-y-auto custom-scrollbar">
                                        {loadingReadmePreview[repo.name] ? (
                                          <div className="flex items-center gap-2 text-indigo-400 py-1 font-bold animate-pulse">
                                            <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                                            <span>{isAr ? 'جاري قراءة ملف README وتحليله...' : 'Reading & resolving README context...'}</span>
                                          </div>
                                        ) : readmePreviews[repo.name] ? (
                                          <p className="whitespace-pre-wrap select-text selection:bg-indigo-500/30">
                                            {readmePreviews[repo.name].length > 320 
                                              ? `${readmePreviews[repo.name].substring(0, 320).trim()}...` 
                                              : readmePreviews[repo.name].trim()
                                            }
                                          </p>
                                        ) : (
                                          <p className="text-slate-500 italic">
                                            {isAr ? 'لم يتم العثور على ملف README أو لم يتم تحميله بعد.' : 'No README file content available or loaded.'}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                      <div className="flex-1 relative">
                                        <select
                                          value={selectedBranches[repo.name] || 'main'}
                                          onChange={(e) => setSelectedBranches(prev => ({ ...prev, [repo.name]: e.target.value }))}
                                          className="w-full bg-slate-900 border border-white/10 text-slate-300 text-xs rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                                        >
                                          {branches[repo.name]?.map(b => (
                                            <option key={b.name} value={b.name}>{b.name}</option>
                                          ))}
                                          {(!branches[repo.name] || branches[repo.name].length === 0) && <option value="main">main</option>}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                                      </div>
                                      <button
                                        onClick={() => fetchReadme(repo.name)}
                                        className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-white/5"
                                      >
                                        <FileText className="w-3.5 h-3.5" /> {isAr ? 'عرض README' : 'View Readme'}
                                      </button>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3">
                                      <div className="flex-1">
                                        <select
                                          value={selectedTemplate}
                                          onChange={(e) => setSelectedTemplate(e.target.value)}
                                          className="w-full bg-slate-900 border border-white/10 text-slate-300 text-xs rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                                        >
                                          <option value="general">{t[lang].templateEngineering}</option>
                                          <option value="technical">{t[lang].templateArchitectural}</option>
                                          <option value="executive">{t[lang].templateSummary}</option>
                                        </select>
                                      </div>
                                      
                                      <button
                                        onClick={() => handleAnalyzeRepo([repo.name], selectedBranches[repo.name] || 'main')}
                                        disabled={analyzingRepo}
                                        className="w-full sm:w-auto px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                                      >
                                        {analyzingRepo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        {isAr ? 'تحليل وإنشاء' : 'Analyze'}
                                      </button>
                                    </div>

                                    {/* Progress indicator */}
                                    {analyzingRepo && (
                                      <div className="bg-slate-900 rounded-lg p-3 border border-indigo-500/30">
                                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] mb-2">
                                          <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                                          <span className="animate-pulse">{progressStages[analysisStage]}</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                                          <div 
                                            className="bg-indigo-500 h-full transition-all duration-500 ease-out"
                                            style={{ width: `${((analysisStage + 1) / 3) * 100}%` }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right: Commits Mini-view */}
                                  <div className="md:w-64 shrink-0 bg-slate-900 rounded-lg p-3 border border-white/5">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                      <GitCommit className="w-3 h-3" />
                                      {isAr ? 'التعديلات الأخيرة' : 'Recent Commits'}
                                    </h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                      {loadingCommitsFor === repo.name ? (
                                        <div className="flex items-center justify-center py-2">
                                          <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                                        </div>
                                      ) : (!commits[repo.name] || commits[repo.name].length === 0) ? (
                                        <p className="text-[10px] text-slate-500">
                                          {isAr ? 'لا يوجد تعديلات مؤخراً' : 'No recent commits'}
                                        </p>
                                      ) : (
                                        commits[repo.name].map((c: any, i: number) => (
                                          <div key={i} className="flex gap-2">
                                            <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                            <div className="min-w-0">
                                              <p className="text-slate-300 text-[11px] truncate leading-tight" title={c.commit.message}>
                                                {c.commit.message}
                                              </p>
                                              <p className="text-[9px] text-slate-500 mt-0.5">
                                                {new Date(c.commit.author.date).toLocaleDateString()}
                                              </p>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      
      {/* Readme Modal */}
      <AnimatePresence>
        {readmeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReadmeModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-full bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 md:p-4 border-b border-white/5 bg-slate-900/50">
                <h2 className="text-xs md:text-sm font-bold text-white flex items-center gap-2 truncate pr-4">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">README.md</span>
                </h2>
                <button onClick={() => setReadmeModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
                {loadingReadme ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm md:prose-base max-w-none text-slate-300 prose-headings:text-white prose-a:text-indigo-400 prose-code:text-indigo-300 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/5">
                    <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm">{readmeContent}</pre>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

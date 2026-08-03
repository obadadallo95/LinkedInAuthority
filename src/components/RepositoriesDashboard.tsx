import React, { useState, useEffect, useMemo } from 'react';
import { Search, GitBranch, RefreshCw, FolderGit2, Star, Calendar, Database, ChevronDown, X, LayoutGrid, List, Zap, Code2, Activity, ShieldCheck, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RepoSparkline } from './RepoSparkline';
import { DataBridgeIllustration } from './Illustrations/DataBridgeIllustration';

export const RepositoriesDashboard = ({
  lang,
  repos,
  loadingRepos,
  repoSearch,
  setRepoSearch,
  refreshRepos,
  orgFilter,
  setOrgFilter,
  orgs,
  demoMode,
  setDemoMode,
  settings,
  setActiveTab
}: any) => {
  const isAr = lang === 'ar';
  const navigate = useNavigate();
  
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'stars'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showTooltip, setShowTooltip] = useState(() => localStorage.getItem('hide_repo_tooltip') !== 'true');
  const [recentRepos, setRecentRepos] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recent_repos') || '[]');
    } catch {
      return [];
    }
  });

  const getStatusDot = (updated_at: string) => {
    const days = (new Date().getTime() - new Date(updated_at).getTime()) / (1000 * 3600 * 24);
    if (days <= 7) return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    if (days <= 30) return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    return "bg-slate-600";
  };

  const sortedRepos = useMemo(() => {
    let filtered = repos.filter((r: any) => r.name.toLowerCase().includes((repoSearch || '').toLowerCase()));
    
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

  // KPI Calculations
  const topLanguage = useMemo(() => {
    if (!repos || repos.length === 0) return null;
    const counts: Record<string, number> = {};
    repos.forEach((r: any) => {
      if (r.language) {
        counts[r.language] = (counts[r.language] || 0) + 1;
      }
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  }, [repos]);

  const mostRecentRepo = useMemo(() => {
    if (!repos || repos.length === 0) return null;
    const valid = repos.filter((r: any) => !r.isFallback);
    return valid.length > 0 ? [...valid].sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] : null;
  }, [repos]);

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      'TypeScript': 'bg-blue-500',
      'JavaScript': 'bg-yellow-400',
      'Python': 'bg-blue-600',
      'Java': 'bg-orange-500',
      'C++': 'bg-pink-500',
      'C#': 'bg-green-600',
      'PHP': 'bg-indigo-400',
      'Ruby': 'bg-red-500',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-orange-600',
      'HTML': 'bg-orange-500',
      'CSS': 'bg-blue-400'
    };
    return colors[lang] || 'bg-slate-400';
  };

  const handleRepoClick = (repo: any) => {
    // Add to recent
    const updated = [repo.name, ...recentRepos.filter(r => r !== repo.name)].slice(0, 5);
    localStorage.setItem('recent_repos', JSON.stringify(updated));
    setRecentRepos(updated);

    const owner = repo.owner?.login || settings.githubUsername || 'demo-developer';
    navigate(`/repositories/${owner}/${repo.name}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 md:gap-8 pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 font-heading tracking-tight">
                <FolderGit2 className="w-7 h-7 md:w-8 md:h-8 text-indigo-400" />
                <span>{isAr ? 'مستودعات جيتهاب' : 'GitHub Repositories'}</span>
              </h2>
              {settings.githubUsername && (
                <button
                  onClick={() => {
                    if (refreshRepos) refreshRepos(true);
                    setRepoSearch('');
                  }}
                  disabled={loadingRepos}
                  className="p-1.5 bg-slate-900 border border-white/10 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingRepos ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-2">
              {isAr ? 'اختر مستودعاً لتحليله وتوليد المحتوى بضغطة زر.' : 'Select repositories to analyze and generate content.'}
            </p>
          </div>
        </div>

        {/* Not connected state */}
        {!settings.githubUsername && !demoMode ? (
          <div className="glass-panel rounded-2xl flex flex-col items-center justify-center p-12 text-center min-h-[400px] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
            <DataBridgeIllustration className="mb-6 relative z-10" />
            <h3 className="text-2xl font-black text-white mb-3 font-heading tracking-tight">
              {isAr ? 'اربط حسابك لتبدأ' : 'Connect to get started'}
            </h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm mb-8">
              {isAr 
                ? 'يرجى ربط حساب GitHub أولاً من الإعدادات لاستعراض مستودعاتك، أو تفعيل الوضع التجريبي لاستكشاف عينات جاهزة.' 
                : 'Please connect your GitHub account in Settings to browse repositories, or enable Demo Mode to explore sandbox repositories.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => navigate('/settings')}
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
          <>
            {/* KPI Cards Row */}
            {!loadingRepos && repos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">{isAr ? 'إجمالي المستودعات' : 'Total Repos'}</p>
                    <p className="text-3xl font-black text-white font-heading">{repos.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <Database className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
                
                {topLanguage && (
                  <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">{isAr ? 'اللغة الأساسية' : 'Top Language'}</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${getLanguageColor(topLanguage)} shadow-[0_0_10px_currentColor] opacity-80`}></span>
                        <p className="text-2xl font-black text-white font-heading">{topLanguage}</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Code2 className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                )}
                
                <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-emerald-500/20 relative overflow-hidden group shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">{isAr ? 'حالة החساب' : 'AI Readiness'}</p>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                      <p className="text-xl font-black font-heading">PRO Active</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Smart Banner */}
            {!loadingRepos && mostRecentRepo && !repoSearch && (
              <div className="relative p-5 md:p-6 rounded-2xl border border-indigo-500/30 overflow-hidden group flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                {/* Vibrant Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20 glass-panel"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                
                <div className="relative z-10 flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <Flame className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="text-base md:text-lg font-black text-white mb-1 font-heading">
                      {isAr ? `نلاحظ نشاطاً جديداً في ${mostRecentRepo.name}!` : `Recent activity in ${mostRecentRepo.name}!`}
                    </h4>
                    <p className="text-sm text-indigo-200/80 font-medium">
                      {isAr ? 'هل ترغب بتوليد منشور احترافي عن آخر تحديثاتك وبناء تواجدك الرقمي؟' : 'Would you like to generate a professional post about your latest updates?'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRepoClick(mostRecentRepo)}
                  className="glow-button shrink-0 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-black transition-all relative z-10 w-full md:w-auto text-center cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 transform duration-200"
                >
                  {isAr ? 'توليد منشور الآن ⚡' : 'Generate Post Now ⚡'}
                </button>
              </div>
            )}

            {/* Toolbar: Search and Filters */}
            <div className="glass-panel p-3 rounded-2xl border border-white/5 flex flex-col lg:flex-row gap-3 items-center justify-between z-20 sticky top-20 shadow-xl backdrop-blur-xl">
              <div className="relative w-full lg:max-w-md">
                <Search className={`absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${repoSearch ? 'text-indigo-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder={isAr ? 'ابحث عن مستودع...' : 'Search repositories...'}
                  className={`w-full bg-slate-900/50 border rounded-xl py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ps-10 pe-10 ${
                    repoSearch ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] bg-slate-900' : 'border-white/10 focus:border-indigo-500/50 hover:border-white/20'
                  }`}
                />
                {repoSearch && (
                  <button onClick={() => setRepoSearch('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1 rounded-md hover:bg-slate-800 transition-colors">
                     <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 hide-scrollbar shrink-0">
                <div className="relative shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-900/50 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-xl py-2.5 ps-4 pe-10 text-sm font-bold text-slate-300 transition-all cursor-pointer outline-none appearance-none"
                  >
                    <option value="date">{isAr ? 'ترتيب: الأحدث' : 'Sort: Latest'}</option>
                    <option value="stars">{isAr ? 'ترتيب: النجوم' : 'Sort: Stars'}</option>
                    <option value="name">{isAr ? 'ترتيب: الاسم' : 'Sort: Name'}</option>
                  </select>
                  <ChevronDown className="absolute end-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-500" />
                </div>

                {(settings.githubUsername || demoMode) && orgs && orgs.length > 0 && (
                  <div className="relative shrink-0">
                    <select
                      value={orgFilter}
                      onChange={(e) => {
                        if (setOrgFilter) setOrgFilter(e.target.value);
                      }}
                      className="bg-slate-900/50 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-xl py-2.5 ps-4 pe-10 text-sm font-bold text-slate-300 transition-all cursor-pointer outline-none appearance-none"
                    >
                      <option value="Personal">{isAr ? 'الحساب الشخصي' : 'Personal Repos'}</option>
                      {orgs.map((org: any) => (
                        <option key={org.login} value={org.login}>
                          {org.login}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute end-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-500" />
                  </div>
                )}

                <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/10 shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                    title={isAr ? 'عرض شبكي' : 'Grid View'}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                    title={isAr ? 'عرض قائمة' : 'List View'}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2.5 rounded-xl border border-white/10 shrink-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isAr ? 'ديمو' : 'DEMO'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (setDemoMode) setDemoMode(!demoMode);
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      demoMode ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        demoMode ? 'rtl:-translate-x-4 ltr:translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Error or Loading State */}
            {repos.some((r: any) => r.isFallback) && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex gap-4">
                  <span className="text-2xl mt-1">⚠️</span>
                  <div>
                    <h5 className="text-sm font-bold text-amber-400 mb-1">
                      {isAr ? 'تم تجاوز حد طلبات GitHub العام' : 'GitHub Rate Limit Reached'}
                    </h5>
                    <p className="text-xs text-amber-200/70 leading-relaxed">
                      {isAr 
                        ? 'يرجى ربط حساب GitHub بنقرة واحدة أو حفظ رمز وصول (PAT) في صفحة الإعدادات لرؤية جميع مستودعاتك.' 
                        : 'Please link your GitHub account or save a Personal Access Token (PAT) in Settings to see all your repositories.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/settings')}
                  className="shrink-0 px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  {isAr ? 'الذهاب للإعدادات ⚙️' : 'Go to Settings ⚙️'}
                </button>
              </div>
            )}

            {loadingRepos ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin opacity-80" />
                <p className="text-sm text-slate-400 font-medium animate-pulse">{isAr ? 'جاري جلب المستودعات...' : 'Fetching repositories...'}</p>
              </div>
            ) : sortedRepos.length === 0 ? (
              <div className="glass-panel flex flex-col items-center justify-center p-12 text-center min-h-[300px] rounded-2xl border border-white/5">
                <DataBridgeIllustration className="mb-8 opacity-50" />
                <h3 className="text-xl font-black text-white mb-2">
                  {isAr ? 'لم يتم العثور على مستودعات' : 'No repositories found'}
                </h3>
                <p className="font-medium text-slate-400 max-w-sm text-sm">
                  {isAr 
                    ? 'تأكد من اختيار الحساب الصحيح، أو حاول تغيير كلمات البحث الخاصة بك.' 
                    : 'Make sure you selected the right account, or try changing your search terms.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {recentRepos.length > 0 && !repoSearch && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 px-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider">
                        {isAr ? 'تم الوصول إليها مؤخراً' : 'Recently Accessed'}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {recentRepos.map(repoName => {
                        const repo = repos.find((r: any) => r.name === repoName);
                        if (!repo) return null;
                        return (
                          <button
                            key={repoName}
                            onClick={() => handleRepoClick(repo)}
                            className="px-4 py-2.5 glass-panel hover:bg-slate-800 border border-white/10 hover:border-indigo-500/30 rounded-xl text-sm text-white font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                          >
                            <FolderGit2 className="w-4 h-4 text-indigo-400" />
                            {repoName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2 mb-5 px-2">
                    <FolderGit2 className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider">
                      {isAr ? 'جميع المستودعات' : 'All Repositories'}
                    </h4>
                  </div>
                  
                  <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
                    {sortedRepos.map((repo: any) => {
                      return (
                        <div 
                          key={repo.id}
                          onClick={() => handleRepoClick(repo)}
                          className="glass-panel rounded-2xl border border-white/5 hover:border-indigo-500/50 overflow-hidden flex flex-col h-full group cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 relative"
                        >
                          {/* Subtle background glow on hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                          
                          <div className={`p-5 flex-1 flex flex-col relative z-10 ${viewMode === 'list' ? 'sm:flex-row sm:items-center sm:gap-6' : ''}`}>
                            
                            <div className="flex-1 flex flex-col min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className="text-lg font-black text-white truncate font-heading tracking-tight group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                                  {repo.name}
                                  <div className={`w-2 h-2 rounded-full ${getStatusDot(repo.updated_at)} shrink-0`} title="Activity Status" />
                                </h3>
                                {repo.language && (
                                  <span className="flex items-center gap-1.5 text-[11px] font-bold bg-slate-900 border border-white/10 px-2.5 py-1 rounded-md shrink-0">
                                    <span className={`w-2 h-2 rounded-full ${getLanguageColor(repo.language)} shadow-[0_0_8px_currentColor] opacity-80`}></span>
                                    <span className="text-slate-300">{repo.language}</span>
                                  </span>
                                )}
                              </div>
                              
                              <p className={`text-sm text-slate-400 leading-relaxed flex-1 ${viewMode === 'list' ? 'mb-2 sm:mb-0 line-clamp-2' : 'mb-5 line-clamp-2 min-h-[40px]'}`}>
                                {repo.description || (isAr ? 'لا يوجد وصف متاح لهذا المستودع.' : 'No description provided for this repository.')}
                              </p>
                              
                              <div className="flex items-center gap-5 text-xs font-bold text-slate-500 mb-4">
                                <span className="flex items-center gap-1.5">
                                  <Star className="w-3.5 h-3.5 text-amber-400" /> {repo.stargazers_count}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Code2 className="w-3.5 h-3.5" /> {Math.round(repo.size / 1024)}MB
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" /> {new Date(repo.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <div className={`flex flex-col gap-4 shrink-0 ${viewMode === 'list' ? 'sm:w-32' : 'w-full'}`}>
                              <div className="h-8 opacity-40 group-hover:opacity-100 transition-opacity duration-300 w-full px-1">
                                <RepoSparkline username={repo.owner?.login || settings.githubUsername} repo={repo.name} token={settings.githubToken} className="w-full h-full" />
                              </div>
                              <button className="w-full py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white font-black transition-all flex items-center justify-center gap-2 shadow-sm">
                                {isAr ? 'فحص عميق' : 'Analyze Repo'} <Zap className="w-3.5 h-3.5" />
                              </button>
                            </div>

                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
};

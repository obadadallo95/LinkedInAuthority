import React, { useState, useEffect, useMemo } from 'react';
import { Search, GitBranch, RefreshCw, FolderGit2, Star, Calendar, Database, ChevronDown, X, LayoutGrid, List, Zap, Code2, Activity, ArrowRight, ArrowLeft } from 'lucide-react';
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
  
  const [recentRepos, setRecentRepos] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('recent_repos');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const getStatusDot = (updated_at: string) => {
    const days = (new Date().getTime() - new Date(updated_at).getTime()) / (1000 * 3600 * 24);
    if (days <= 7) return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]";
    if (days <= 30) return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]";
    return "bg-slate-500";
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
      'TypeScript': 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
      'JavaScript': 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]',
      'Python': 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]',
      'Java': 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]',
      'C++': 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]',
      'C#': 'bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.6)]',
      'PHP': 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]',
      'Ruby': 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
      'Go': 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
      'Rust': 'bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.6)]',
      'HTML': 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]',
      'CSS': 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]'
    };
    return colors[lang] || 'bg-slate-400';
  };

  const handleRepoClick = (repo: any) => {
    const updated = [repo.name, ...recentRepos.filter(r => r !== repo.name)].slice(0, 5);
    localStorage.setItem('recent_repos', JSON.stringify(updated));
    setRecentRepos(updated);

    const owner = repo.owner?.login || settings.githubUsername || 'demo-developer';
    navigate(`/repositories/${owner}/${repo.name}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 pb-12">
        
        {/* HERO GLASS PANEL */}
        <div className="glass-panel relative overflow-hidden rounded-2xl border border-white/10 p-6 flex flex-col lg:flex-row items-center justify-between gap-6 bg-gradient-to-br from-slate-900/90 to-slate-800/90 shadow-2xl">
          {/* Background Glows */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
          
          <div className="flex flex-col gap-3 relative z-10">
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 font-heading tracking-tight drop-shadow-md">
              <FolderGit2 className="w-8 h-8 text-indigo-400" />
              <span>{isAr ? 'المستودعات' : 'Repositories'}</span>
            </h2>
            
            {!loadingRepos && repos.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-slate-950/50 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 backdrop-blur-sm">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  {isAr ? 'الإجمالي:' : 'Total:'} <span className="text-white">{repos.length}</span>
                </span>
                {topLanguage && (
                  <span className="px-3 py-1.5 rounded-lg bg-slate-950/50 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 backdrop-blur-sm">
                    <span className={`w-2 h-2 rounded-full ${getLanguageColor(topLanguage)}`}></span>
                    {topLanguage}
                  </span>
                )}
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center gap-2 backdrop-blur-sm shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <Activity className="w-3.5 h-3.5" /> PRO Active
                </span>
              </div>
            )}
          </div>
          
          {/* Smart AI Suggestion Card inside Hero */}
          {!loadingRepos && mostRecentRepo && !repoSearch && (
            <div className="relative z-10 w-full lg:w-auto bg-slate-950/60 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 backdrop-blur-md shadow-lg shadow-indigo-500/10">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-start">
                <p className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider mb-1">
                  <Zap className="w-3.5 h-3.5" /> {isAr ? 'اقتراح الذكاء الاصطناعي' : 'AI Suggestion'}
                </p>
                <p className="text-sm font-medium text-slate-200">
                  {isAr ? `نشاط جديد في ${mostRecentRepo.name}` : `New activity in ${mostRecentRepo.name}`}
                </p>
              </div>
              <button 
                onClick={() => handleRepoClick(mostRecentRepo)}
                className="glow-button px-5 py-2.5 rounded-lg font-bold text-sm text-white flex items-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-600/30 w-full sm:w-auto justify-center"
              >
                {isAr ? 'توليد منشور ⚡' : 'Generate Post ⚡'}
              </button>
            </div>
          )}
        </div>

        {!settings.githubUsername && !demoMode ? (
          <div className="glass-panel rounded-xl flex flex-col items-center justify-center p-12 text-center min-h-[300px] border border-white/5">
            <DataBridgeIllustration className="mb-6 opacity-80" />
            <h3 className="text-xl font-bold text-white mb-2 font-heading tracking-tight">
              {isAr ? 'لم يتم ربط GitHub' : 'GitHub Not Connected'}
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              {isAr 
                ? 'اربط حسابك لاستعراض مستودعاتك الحقيقية، أو استخدم الوضع التجريبي.' 
                : 'Connect your account to browse real repositories, or use demo mode.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/settings')} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer">
                {isAr ? 'الإعدادات' : 'Settings'}
              </button>
              <button onClick={() => setDemoMode && setDemoMode(true)} className="glow-button px-5 py-2 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-600/20">
                {isAr ? 'الوضع التجريبي' : 'Demo Mode'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* FLOATING TOOLBAR */}
            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-white/10 z-30 sticky top-20 backdrop-blur-xl shadow-lg">
              <div className="relative w-full lg:max-w-md">
                <Search className={`absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${repoSearch ? 'text-indigo-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder={isAr ? 'البحث عن مستودع...' : 'Search repositories...'}
                  className={`w-full bg-slate-950 border rounded-lg py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ps-9 pe-8 ${
                    repoSearch ? 'border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'border-white/10 focus:border-indigo-500/50'
                  }`}
                />
                {repoSearch && (
                  <button onClick={() => setRepoSearch('')} className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1">
                     <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto hide-scrollbar shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-white/10 hover:border-white/20 rounded-lg py-2 px-3 text-sm font-semibold text-slate-300 outline-none cursor-pointer transition-colors"
                >
                  <option value="date">{isAr ? 'الترتيب: الأحدث' : 'Sort: Latest'}</option>
                  <option value="stars">{isAr ? 'الترتيب: النجوم' : 'Sort: Stars'}</option>
                  <option value="name">{isAr ? 'الترتيب: الاسم' : 'Sort: Name'}</option>
                </select>

                {(settings.githubUsername || demoMode) && orgs && orgs.length > 0 && (
                  <select
                    value={orgFilter}
                    onChange={(e) => setOrgFilter && setOrgFilter(e.target.value)}
                    className="bg-slate-950 border border-white/10 hover:border-white/20 rounded-lg py-2 px-3 text-sm font-semibold text-slate-300 outline-none cursor-pointer transition-colors"
                  >
                    <option value="Personal">{isAr ? 'شخصي' : 'Personal'}</option>
                    {orgs.map((org: any) => (
                      <option key={org.login} value={org.login}>{org.login}</option>
                    ))}
                  </select>
                )}

                <div className="flex items-center bg-slate-950 rounded-lg border border-white/10 shrink-0 p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 transition-colors cursor-pointer rounded-md ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 transition-colors cursor-pointer rounded-md ${viewMode === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {settings.githubUsername && (
                  <button
                    onClick={() => {
                      if (refreshRepos) refreshRepos(true);
                    }}
                    disabled={loadingRepos}
                    className="p-2 bg-slate-950 border border-white/10 hover:border-white/20 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                    title={isAr ? 'تحديث المستودعات' : 'Refresh Repositories'}
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingRepos ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>
                )}

                <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-white/10 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Demo</span>
                  <button
                    type="button"
                    onClick={() => setDemoMode && setDemoMode(!demoMode)}
                    className={`relative inline-flex h-4 w-7 cursor-pointer rounded-full transition-colors ${demoMode ? 'bg-indigo-500' : 'bg-slate-700'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform mt-0.5 ms-0.5 ${demoMode ? (isAr ? '-translate-x-3' : 'translate-x-3') : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* CONTENT AREA */}
            {loadingRepos ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Database className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium animate-pulse">{isAr ? 'جاري مزامنة المستودعات...' : 'Syncing repositories...'}</p>
              </div>
            ) : sortedRepos.length === 0 ? (
              <div className="text-center py-20 glass-panel rounded-2xl border border-white/5">
                <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-300 font-medium mb-2">{isAr ? 'لم يتم العثور على مستودعات' : 'No repositories found'}</p>
                <p className="text-slate-500 text-sm">{isAr ? 'حاول تغيير كلمات البحث أو تحديث القائمة.' : 'Try changing your search terms or refreshing.'}</p>
              </div>
            ) : (
              <div className="mt-2">
                
                {/* RICH GLASS CARDS GRID */}
                <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 lg:grid-cols-2'}`}>
                  {sortedRepos.map((repo: any) => {
                    return (
                      <div 
                        key={repo.id}
                        onClick={() => handleRepoClick(repo)}
                        className={`group relative glass-panel bg-slate-900/50 hover:bg-slate-800/80 border border-white/10 hover:border-indigo-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-indigo-500/10 flex flex-col ${viewMode === 'list' ? 'sm:flex-row' : ''}`}
                      >
                        {/* Beautiful Background Sparkline */}
                        <div className="absolute bottom-0 left-0 right-0 h-24 opacity-[0.15] group-hover:opacity-30 transition-opacity duration-500 pointer-events-none z-0">
                           <RepoSparkline username={repo.owner?.login || settings.githubUsername} repo={repo.name} token={settings.githubToken} className="w-full h-full" />
                        </div>
                        
                        <div className={`p-5 flex-1 flex flex-col relative z-10 ${viewMode === 'list' ? 'sm:flex-row sm:items-center sm:gap-6' : 'gap-3'}`}>
                          
                          <div className="flex-1 min-w-0 flex flex-col h-full">
                            
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="text-base font-bold text-white truncate group-hover:text-indigo-300 transition-colors flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${getStatusDot(repo.updated_at)} shrink-0`} />
                                {repo.name}
                              </h3>
                              {/* Hover Action Indicator */}
                              <div className={`opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 shrink-0 bg-indigo-500/20 p-1.5 rounded-md`}>
                                {isAr ? <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />}
                              </div>
                            </div>
                            
                            {/* Description */}
                            <p className={`text-sm text-slate-400 leading-relaxed mb-4 flex-1 ${viewMode === 'list' ? 'line-clamp-2' : 'line-clamp-2 min-h-[40px]'}`}>
                              {repo.description || (isAr ? 'لا يوجد وصف متاح لهذا المستودع.' : 'No description available for this repository.')}
                            </p>
                            
                            {/* Rich Metadata Footer */}
                            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 mt-auto pt-4 border-t border-white/5">
                              {repo.language && (
                                <span className="flex items-center gap-1.5 text-slate-200">
                                  <span className={`w-2 h-2 rounded-full ${getLanguageColor(repo.language)}`}></span>
                                  {repo.language}
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-amber-400" /> {repo.stargazers_count}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Database className="w-3.5 h-3.5 text-slate-500" /> {Math.round(repo.size / 1024)}M
                              </span>
                              <span className="flex items-center gap-1.5 ms-auto text-slate-500">
                                {new Date(repo.updated_at).toLocaleDateString(isAr ? 'ar' : 'en', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
};

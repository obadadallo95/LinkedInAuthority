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
  
  // Try to load recent repos safely
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
    const updated = [repo.name, ...recentRepos.filter(r => r !== repo.name)].slice(0, 5);
    localStorage.setItem('recent_repos', JSON.stringify(updated));
    setRecentRepos(updated);

    const owner = repo.owner?.login || settings.githubUsername || 'demo-developer';
    navigate(`/repositories/${owner}/${repo.name}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 pb-12">
        
        {/* Compact Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 font-heading tracking-tight">
                <FolderGit2 className="w-6 h-6 text-indigo-400" />
                <span>{isAr ? 'المستودعات' : 'Repositories'}</span>
              </h2>
              
              {/* Compact KPIs next to title */}
              {!loadingRepos && repos.length > 0 && (
                <div className="flex items-center gap-2 ms-2">
                  <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/5 text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-indigo-400" />
                    {repos.length}
                  </span>
                  {topLanguage && (
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-white/5 text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${getLanguageColor(topLanguage)}`}></span>
                      {topLanguage}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <Activity className="w-3 h-3" /> PRO
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             {settings.githubUsername && (
                <button
                  onClick={() => {
                    if (refreshRepos) refreshRepos(true);
                    setRepoSearch('');
                  }}
                  disabled={loadingRepos}
                  className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-md text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRepos ? 'animate-spin' : ''}`} />
                  {isAr ? 'تحديث' : 'Refresh'}
                </button>
              )}
          </div>
        </div>

        {/* Slim Smart Banner */}
        {!loadingRepos && mostRecentRepo && !repoSearch && (
          <div className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group cursor-pointer hover:bg-indigo-500/20 transition-colors" onClick={() => handleRepoClick(mostRecentRepo)}>
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
              <p className="text-sm font-medium text-indigo-100">
                <span className="font-bold">{isAr ? 'نشاط حديث:' : 'Recent Activity:'}</span> {mostRecentRepo.name}
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 group-hover:text-indigo-300 transition-colors">
              {isAr ? 'تحليل وإنشاء منشور' : 'Analyze & Generate'}
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </span>
          </div>
        )}

        {!settings.githubUsername && !demoMode ? (
          <div className="glass-panel rounded-xl flex flex-col items-center justify-center p-12 text-center min-h-[300px] border border-white/5 mt-4">
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
              <button onClick={() => navigate('/settings')} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer">
                {isAr ? 'الإعدادات' : 'Settings'}
              </button>
              <button onClick={() => setDemoMode && setDemoMode(true)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-600/20">
                {isAr ? 'الوضع التجريبي' : 'Demo Mode'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Slim Toolbar */}
            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-white/5 z-20 sticky top-20 backdrop-blur-md">
              <div className="relative w-full lg:max-w-sm">
                <Search className={`absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${repoSearch ? 'text-indigo-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder={isAr ? 'ابحث...' : 'Search...'}
                  className={`w-full bg-slate-950 border rounded-md py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all ps-8 pe-8 ${
                    repoSearch ? 'border-indigo-500/50' : 'border-white/10 focus:border-indigo-500/50'
                  }`}
                />
                {repoSearch && (
                  <button onClick={() => setRepoSearch('')} className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer">
                     <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto hide-scrollbar shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-white/10 rounded-md py-1.5 px-3 text-xs font-semibold text-slate-300 outline-none cursor-pointer"
                >
                  <option value="date">{isAr ? 'الأحدث' : 'Latest'}</option>
                  <option value="stars">{isAr ? 'النجوم' : 'Stars'}</option>
                  <option value="name">{isAr ? 'الاسم' : 'Name'}</option>
                </select>

                {(settings.githubUsername || demoMode) && orgs && orgs.length > 0 && (
                  <select
                    value={orgFilter}
                    onChange={(e) => setOrgFilter && setOrgFilter(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-md py-1.5 px-3 text-xs font-semibold text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Personal">{isAr ? 'شخصي' : 'Personal'}</option>
                    {orgs.map((org: any) => (
                      <option key={org.login} value={org.login}>{org.login}</option>
                    ))}
                  </select>
                )}

                <div className="flex items-center bg-slate-950 rounded-md border border-white/10 shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 transition-colors cursor-pointer rounded-s-md ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 transition-colors cursor-pointer rounded-e-md ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-md border border-white/10 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400">DEMO</span>
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

            {/* Content Area */}
            {loadingRepos ? (
              <div className="h-48 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : sortedRepos.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-400 text-sm">{isAr ? 'لم يتم العثور على مستودعات' : 'No repositories found'}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 mt-2">
                
                {/* Repos Grid */}
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 lg:grid-cols-2'}`}>
                  {sortedRepos.map((repo: any) => {
                    return (
                      <div 
                        key={repo.id}
                        onClick={() => handleRepoClick(repo)}
                        className={`group relative bg-slate-900/40 border border-white/5 hover:border-indigo-500/40 rounded-xl overflow-hidden cursor-pointer transition-all hover:bg-slate-800/40 flex flex-col ${viewMode === 'list' ? 'sm:flex-row' : ''}`}
                      >
                        {/* Subtle Background Sparkline */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-10 pointer-events-none">
                           <RepoSparkline username={repo.owner?.login || settings.githubUsername} repo={repo.name} token={settings.githubToken} className="w-full h-full" />
                        </div>
                        
                        <div className={`p-4 flex-1 flex flex-col relative z-10 ${viewMode === 'list' ? 'sm:flex-row sm:items-center sm:gap-6' : 'gap-2'}`}>
                          
                          <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                                {repo.name}
                                <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(repo.updated_at)} shrink-0`} />
                              </h3>
                            </div>
                            
                            <p className={`text-xs text-slate-400 leading-relaxed mb-3 flex-1 ${viewMode === 'list' ? 'line-clamp-1' : 'line-clamp-2 min-h-[32px]'}`}>
                              {repo.description || (isAr ? 'لا يوجد وصف.' : 'No description.')}
                            </p>
                            
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 mt-auto">
                              {repo.language && (
                                <span className="flex items-center gap-1 text-slate-300">
                                  <span className={`w-1.5 h-1.5 rounded-full ${getLanguageColor(repo.language)}`}></span>
                                  {repo.language}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-slate-400" /> {repo.stargazers_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Database className="w-3 h-3" /> {Math.round(repo.size / 1024)}M
                              </span>
                              <span className="flex items-center gap-1 ms-auto">
                                {new Date(repo.updated_at).toLocaleDateString(isAr ? 'ar' : 'en', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          
                          {/* Hover Action Indicator */}
                          <div className={`absolute ${isAr ? 'left-4' : 'right-4'} top-4 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300`}>
                            {isAr ? <ArrowLeft className="w-4 h-4 text-indigo-400" /> : <ArrowRight className="w-4 h-4 text-indigo-400" />}
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

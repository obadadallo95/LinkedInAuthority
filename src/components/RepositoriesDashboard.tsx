import React, { useState, useEffect, useMemo } from 'react';
import { Search, GitBranch, RefreshCw, FolderGit2, Star, Calendar, Database, ChevronDown, X } from 'lucide-react';
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
    if (days <= 7) return "bg-green-500";
    if (days <= 30) return "bg-yellow-500";
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

  const handleRepoClick = (repo: any) => {
    // Add to recent
    const updated = [repo.name, ...recentRepos.filter(r => r !== repo.name)].slice(0, 5);
    localStorage.setItem('recent_repos', JSON.stringify(updated));
    setRecentRepos(updated);

    const owner = repo.owner?.login || settings.githubUsername || 'demo-developer';
    navigate(`/repositories/${owner}/${repo.name}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 md:gap-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 font-heading tracking-tight">
                <FolderGit2 className="w-6 h-6 md:w-7 md:h-7 text-indigo-400" />
                <span>{isAr ? 'مستودعات جيتهاب' : 'GitHub Repositories'}</span>
              </h2>
              {settings.githubUsername && (
                <button
                  onClick={() => {
                    if (refreshRepos) refreshRepos(true);
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
              {isAr ? 'اختر مستودعاً لتحليله وتوليد المحتوى.' : 'Select repositories to analyze and generate content.'}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl flex flex-col overflow-hidden relative">
          {/* Subtle gradient accent line at the top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50"></div>
          
          {!settings.githubUsername && !demoMode ? (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] relative z-10">
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
            <div className="flex flex-col">
              <div className="relative">
                {showTooltip && (
                  <div className="absolute -top-10 end-4 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-indigo-500/20 z-10 flex items-center gap-2">
                    <Search className="w-3 h-3" />
                    {isAr ? 'استخدم البحث والفلترة لايجاد مستودعاتك' : 'Use search and filters to find repos'}
                    <button onClick={() => { setShowTooltip(false); localStorage.setItem('hide_repo_tooltip', 'true'); }} className="ms-1 opacity-70 hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute -bottom-1 end-4 w-2 h-2 bg-indigo-500 rotate-45" />
                  </div>
                )}
                <div className="p-3 md:p-4 border-b border-white/5 bg-slate-900/50 flex flex-col gap-3">
                  <div className="relative w-full">
                    <Search className={`absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${repoSearch ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder={isAr ? 'البحث في المستودعات...' : 'Search repositories...'}
                      className={`w-full bg-slate-950 border rounded-lg py-2.5 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ps-9 pe-3 ${
                        repoSearch ? 'border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'border-white/5 focus:border-indigo-500'
                      }`}
                    />
                    {repoSearch && (
                      <button onClick={() => setRepoSearch('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                         <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full py-1 flex-wrap">
                    <div className="relative shrink-0">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className={`bg-slate-950/80 border rounded-full py-1.5 ps-3.5 pe-8 text-xs font-semibold tracking-wide transition-all cursor-pointer outline-none appearance-none ${
                          sortBy !== 'date'
                            ? 'border-indigo-500/40 text-indigo-300'
                            : 'border-white/10 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <option value="date">{isAr ? 'الأحدث' : 'Sort: Latest'}</option>
                        <option value="stars">{isAr ? 'النجوم' : 'Sort: Stars'}</option>
                        <option value="name">{isAr ? 'الاسم' : 'Sort: Name'}</option>
                      </select>
                      <ChevronDown className={`absolute end-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors ${sortBy !== 'date' ? 'text-indigo-400' : 'text-slate-500'}`} />
                    </div>

                    {(settings.githubUsername || demoMode) && orgs && orgs.length > 0 && (
                      <div className="relative shrink-0">
                        <select
                          value={orgFilter}
                          onChange={(e) => {
                            if (setOrgFilter) setOrgFilter(e.target.value);
                          }}
                          className={`bg-slate-950/80 border rounded-full py-1.5 ps-3.5 pe-8 text-xs font-semibold tracking-wide transition-all cursor-pointer outline-none appearance-none ${
                            orgFilter !== 'Personal'
                              ? 'border-indigo-500/40 text-indigo-300'
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
                        <ChevronDown className={`absolute end-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors ${orgFilter !== 'Personal' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      </div>
                    )}

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
                            demoMode ? 'rtl:-translate-x-4 ltr:translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

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
                            ? 'يرجى ربط حساب GitHub بنقرة واحدة أو حفظ رمز وصول (PAT) في صفحة الإعدادات لرؤية جميع مستودعاتك.' 
                            : 'Please link your GitHub account or save a Personal Access Token (PAT) in Settings to see all your repositories.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/settings')}
                      className="shrink-0 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-[10.5px] font-black transition-all cursor-pointer"
                    >
                      {isAr ? 'الذهاب للإعدادات ⚙️' : 'Go to Settings ⚙️'}
                    </button>
                  </div>
                )}

                {loadingRepos ? (
                  <div className="h-48 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                ) : sortedRepos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                    <DataBridgeIllustration className="mb-8" />
                    <h3 className="text-lg font-bold text-white mb-2">
                      {isAr ? 'لم يتم العثور على مستودعات' : 'No repositories found'}
                    </h3>
                    <p className="font-medium text-slate-400 max-w-sm text-sm">
                      {isAr 
                        ? 'تأكد من اختيار الحساب الصحيح، أو حاول تغيير كلمات البحث الخاصة بك.' 
                        : 'Make sure you selected the right account, or try changing your search terms.'}
                    </p>
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
                                onClick={() => handleRepoClick(repo)}
                                className="px-3 py-1.5 glass-panel hover:bg-slate-700 border border-white/5 rounded-lg text-xs text-slate-300 font-medium transition-colors flex items-center gap-1.5"
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
                    <div className="grid grid-cols-1 gap-2.5">
                      {sortedRepos.map((repo: any) => {
                        return (
                          <div 
                            key={repo.id}
                            onClick={() => handleRepoClick(repo)}
                            className="glass-panel glass-panel-hover hover:border-indigo-500/50 rounded-xl overflow-hidden cursor-pointer group"
                          >
                            <div className="p-3 md:p-4 flex items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <GitBranch className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                  <h3 className="text-sm font-bold text-white truncate font-heading tracking-tight group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                                    {repo.name}
                                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(repo.updated_at)} shrink-0`} title="Activity Status" />
                                  </h3>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                                  {repo.description || (isAr ? 'لا يوجد وصف' : 'No description provided')}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-4 text-[10px] font-medium text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3" /> {repo.stargazers_count}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Database className="w-3 h-3" /> {Math.round(repo.size / 1024)}MB
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {new Date(repo.updated_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 hidden sm:block opacity-60 group-hover:opacity-100 transition-opacity">
                                <RepoSparkline username={repo.owner?.login || settings.githubUsername} repo={repo.name} token={settings.githubToken} />
                              </div>
                            </div>
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
    </div>
  );
};

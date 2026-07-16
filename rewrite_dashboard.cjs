const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { Sparkles, Search, GitBranch, RefreshCw, FolderGit2, Star, Calendar, Database, GitCommit, ChevronDown, FileText, CheckSquare, Square, X, ChevronRight, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { t } from '../constants';
import { RepoSparkline } from './RepoSparkline';
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
  setActiveTab
}: any) => {
  const isAr = lang === 'ar';
  
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'stars'>('date');
  const [commits, setCommits] = useState<Record<string, any[]>>({});
  const [branches, setBranches] = useState<Record<string, any[]>>({});
  const [selectedBranches, setSelectedBranches] = useState<Record<string, string>>({});
  
  const [loadingCommitsFor, setLoadingCommitsFor] = useState<string | null>(null);
  const [analysisStage, setAnalysisStage] = useState(0);
  
  // Bulk selection
  const [checkedRepos, setCheckedRepos] = useState<Set<string>>(new Set());
  
  // Readme modal
  const [readmeModalOpen, setReadmeModalOpen] = useState(false);
  const [readmeContent, setReadmeContent] = useState('');
  const [loadingReadme, setLoadingReadme] = useState(false);

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
    if (!settings.githubUsername) return;
    setReadmeModalOpen(true);
    setLoadingReadme(true);
    setReadmeContent('');
    try {
      const headers: Record<string, string> = { "Accept": "application/vnd.github.v3.raw" };
      if (settings.githubToken) headers.Authorization = \`token \${settings.githubToken}\`;
      const branch = selectedBranches[repoName] || 'main';
      const res = await fetch(\`https://api.github.com/repos/\${settings.githubUsername}/\${repoName}/readme?ref=\${branch}\`, { headers });
      if (res.ok) {
        const text = await res.text();
        setReadmeContent(text);
      } else {
        setReadmeContent(isAr ? 'لم يتم العثور على ملف README.' : 'No README found.');
      }
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
      } else if (sortBy === 'size') {
        return b.size - a.size;
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
    if (!settings.githubUsername || commits[repoName]) return; // already loaded or no auth

    setLoadingCommitsFor(repoName);
    
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (settings.githubToken) {
      headers.Authorization = \`token \${settings.githubToken}\`;
    }

    // Fetch Commits
    fetch(\`https://api.github.com/repos/\${settings.githubUsername}/\${repoName}/commits?per_page=3\`, { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setCommits(prev => ({ ...prev, [repoName]: Array.isArray(data) ? data : [] }));
      })
      .catch(() => setCommits(prev => ({ ...prev, [repoName]: [] })));
      
    // Fetch Branches
    fetch(\`https://api.github.com/repos/\${settings.githubUsername}/\${repoName}/branches\`, { headers })
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
    <div className="flex-1 overflow-y-auto p-3 md:p-8 custom-scrollbar pb-32 md:pb-8 flex flex-col h-full w-full bg-slate-950">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full gap-4 md:gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <FolderGit2 className="w-6 h-6 md:w-7 md:h-7 text-indigo-400" />
              <span>{isAr ? 'مستودعات جيتهاب' : 'GitHub Repositories'}</span>
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
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
        <div className="flex-1 bg-slate-900 border border-white/5 rounded-2xl shadow-xl shadow-slate-900/50 flex flex-col min-h-0 overflow-hidden">
          {!settings.githubUsername ? (
            <div className="m-auto text-center p-6">
              <p className="text-sm text-slate-400 font-medium mb-3">
                {isAr ? 'يرجى ربط حساب GitHub أولاً من الإعدادات لاستعراض المستودعات.' : 'Please connect your GitHub account in Settings first to browse repositories.'}
              </p>
              <button
                onClick={() => setActiveTab('settings')}
                className="px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 font-bold text-xs rounded-xl border border-indigo-500/30 uppercase tracking-widest transition-colors"
              >
                {isAr ? 'الذهاب للإعدادات' : 'Go to Settings'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Toolbar */}
              <div className="p-3 md:p-4 border-b border-white/5 bg-slate-900/50 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder={isAr ? 'البحث في المستودعات...' : 'Search repositories...'}
                    className={\`w-full bg-slate-950 border border-white/5 rounded-lg py-2.5 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors \${
                      isAr ? 'pr-3 pl-9' : 'pl-9 pr-3'
                    }\`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0 flex-1 sm:flex-none">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full sm:w-auto bg-slate-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none pr-8"
                    >
                      <option value="date">{isAr ? 'الأحدث' : 'Sort: Latest'}</option>
                      <option value="stars">{isAr ? 'النجوم' : 'Sort: Stars'}</option>
                      <option value="size">{isAr ? 'الحجم' : 'Sort: Size'}</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  </div>
                  <button onClick={toggleAll} className="h-[38px] md:h-[42px] px-3 bg-slate-950 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center justify-center shrink-0" title="Select All">
                    {checkedRepos.size > 0 && checkedRepos.size === sortedRepos.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Repositories Grid/List */}
              <div className="flex-1 overflow-y-auto p-2 md:p-4 custom-scrollbar bg-slate-950/30">
                {loadingRepos ? (
                  <div className="h-full flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                ) : sortedRepos.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    {isAr ? 'لا توجد مستودعات متاحة.' : 'No repositories available.'}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {sortedRepos.map((repo: any) => {
                      const isExpanded = selectedRepo === repo.name;
                      const isChecked = checkedRepos.has(repo.name);
                      
                      return (
                        <div key={repo.id} className={\`bg-slate-900 border rounded-xl overflow-hidden transition-all duration-200 \${isExpanded ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-white/5 hover:border-white/10'}\`}>
                          
                          {/* Card Header (Always visible) */}
                          <div 
                            onClick={() => toggleRepoExpand(repo.name)}
                            className="p-3 md:p-4 flex items-start gap-3 cursor-pointer group"
                          >
                            <button 
                              onClick={(e) => toggleRepoCheck(repo.name, e)}
                              className="mt-0.5 shrink-0 text-slate-500 hover:text-indigo-400 transition-colors p-1 -ml-1"
                            >
                              {isChecked ? <CheckSquare className="w-5 h-5 text-indigo-400" /> : <Square className="w-5 h-5" />}
                            </button>
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <GitBranch className="w-4 h-4 text-slate-500" />
                                <h3 className="text-sm md:text-base font-bold text-white truncate tracking-tight group-hover:text-indigo-300 transition-colors">
                                  {repo.name}
                                </h3>
                              </div>
                              <p className="text-[11px] md:text-xs text-slate-400 line-clamp-1 mb-2">
                                {repo.description || (isAr ? 'لا يوجد وصف' : 'No description provided')}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] md:text-[11px] font-medium text-slate-500 hidden md:flex">
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

                            <div className="shrink-0 flex items-center gap-3">
                              <div className="hidden sm:block">
                                <RepoSparkline username={settings.githubUsername} repo={repo.name} token={settings.githubToken} />
                              </div>
                              <div className={\`w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-transform duration-200 \${isExpanded ? 'rotate-180' : ''}\`}>
                                <ChevronDownIcon className="w-4 h-4" />
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
                                            style={{ width: \`\${((analysisStage + 1) / 3) * 100}%\` }}
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
                )}
              </div>
            </div>
          )}
        </div>
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
`
fs.writeFileSync('src/components/RepositoriesDashboard.tsx', code);
console.log("Rewritten dashboard with accordion layout and compact mobile");

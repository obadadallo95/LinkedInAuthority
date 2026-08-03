import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, FolderGit2, GitCommit, FileText, RefreshCw, Save, Copy, Zap, Lock, BookOpen, CircleDot, PlayCircle, Shield, LineChart, FileCode2, Folder, Clock, CheckCircle2, GitBranch, List, Star, Code2, ChevronDown, Search, Target, AlertTriangle, MessageSquare, Repeat2, Send, ThumbsUp, Globe, Check, Activity, Bell, Settings2, ToggleLeft, ToggleRight } from 'lucide-react';
import { fetchReadme } from '../services/githubService';
import { useAuth } from '../application/AuthContext';
import { firestoreService, DraftData } from '../services/firestoreService';
import { DeepScanLoader } from './DeepScan/DeepScanLoader';
import { IntentCards } from './IntentCards';
import { TransformationLoader } from './TransformationLoader';
import { motion, AnimatePresence } from 'framer-motion';

const GithubIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/>
  </svg>
);

const LinkedinIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export const RepoDetails = ({ lang, settings, demoMode }: any) => {
  const { user } = useAuth();
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [commits, setCommits] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [repoFiles, setRepoFiles] = useState<any[]>([]);
  const [repoMeta, setRepoMeta] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [readme, setReadme] = useState('');
  
  const [activeTab, setActiveTab] = useState('linkedin'); // Default to our special tab

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null); // For the generated post

  // New Intelligence Engine State
  const [repoPhase, setRepoPhase] = useState<'idle' | 'angles' | 'generating' | 'deep_scanning' | 'result'>('idle');
  const [intent, setIntent] = useState('auto');
  const [angles, setAngles] = useState<any[]>([]);
  const [selectedAngleId, setSelectedAngleId] = useState('');
  const [analysisToken, setAnalysisToken] = useState('');
  const [humanContext, setHumanContext] = useState('');
  const [analyzeConflicts, setAnalyzeConflicts] = useState<any[]>([]);
  const [projectDescription, setProjectDescription] = useState('');
  const [needsContext, setNeedsContext] = useState(false);
  const [targetAudience, setTargetAudience] = useState('Software Engineers');
  const [hasCopied, setHasCopied] = useState(false);
  const [hasCopiedComment, setHasCopiedComment] = useState(false);

  const [analyzingCommits, setAnalyzingCommits] = useState(false);
  const [commitAnalysis, setCommitAnalysis] = useState<any>(null);
  
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [savingCommitAnalysis, setSavingCommitAnalysis] = useState(false);

  // Monitoring State
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [monitoringConfig, setMonitoringConfig] = useState({
    monitorCommits: true,
    monitorIssues: false,
    monitorPullRequests: true
  });
  const [savingMonitoring, setSavingMonitoring] = useState(false);

  useEffect(() => {
    if (user && owner && repo) {
      firestoreService.getProject(user.uid, owner, repo).then((proj) => {
        if (proj) {
           if (proj.monitoringEnabled !== undefined) setMonitoringEnabled(proj.monitoringEnabled);
           if (proj.monitoringConfig) setMonitoringConfig({ ...monitoringConfig, ...proj.monitoringConfig });
        }
      }).catch(err => {
        console.error("Error fetching project:", err);
      });
    }
  }, [user, owner, repo]);

  const saveToFirestore = async (type: 'repo_analysis' | 'commit_update', data: any, setSavingState: (s: boolean) => void) => {
    if (!user) {
      alert(isAr ? 'يجب تسجيل الدخول لحفظ المسودة' : 'You must be logged in to save drafts.');
      return;
    }
    setSavingState(true);
    try {
      const projectId = await firestoreService.saveProject(user.uid, {
        owner: owner as string,
        repo: repo as string,
        fullName: `${owner}/${repo}`,
        description: data.summary || data.title || '',
        language: repoMeta?.language || '',
      });

      const draft: DraftData = {
        projectId,
        type,
        title: data.title || (type === 'repo_analysis' ? 'Repository Analysis' : 'Technical Update'),
        content: JSON.stringify(data),
        status: 'draft',
      };
      await firestoreService.saveDraft(user.uid, draft);
      alert(isAr ? 'تم حفظ المسودة بنجاح' : 'Draft saved successfully');
    } catch (error) {
      console.error(error);
      alert(isAr ? 'حدث خطأ أثناء الحفظ' : 'Error saving draft');
    } finally {
      setSavingState(false);
    }
  };

  useEffect(() => {
    if (!owner || !repo) return;
    if (demoMode) {
      setCommits([{ commit: { message: "refactor: optimize rendering pipeline", author: { date: new Date().toISOString() } } }]);
      setBranches([{ name: 'main' }]);
      setRepoFiles([
        { name: 'src', type: 'dir' },
        { name: 'public', type: 'dir' },
        { name: 'package.json', type: 'file' },
        { name: 'README.md', type: 'file' }
      ]);
      setRepoMeta({ description: 'A demo repository for showcasing features.', stargazers_count: 42, language: 'TypeScript', private: false });
      setReadme('# Demo Repository\nThis is a demo repository.');
      setLoading(false);
      return;
    }

    if (!settings?.githubToken && !settings?.githubUsername) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
    if (settings.githubToken) headers.Authorization = `token ${settings.githubToken}`;

    Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }).then(r => r.ok ? r.json() : null),
      fetchReadme(owner, repo, settings.githubToken, false).catch(() => '')
    ]).then(([commitsData, branchesData, contentsData, metaData, readmeData]) => {
      setCommits(Array.isArray(commitsData) ? commitsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      if (Array.isArray(branchesData) && branchesData.length > 0) {
        setSelectedBranch(branchesData.find(b => b.name === 'main' || b.name === 'master')?.name || branchesData[0].name);
      }
      
      let files = Array.isArray(contentsData) ? contentsData : [];
      // Sort: dirs first, then files, alphabetically
      files.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
      });
      setRepoFiles(files);
      setRepoMeta(metaData);
      setReadme(readmeData);
      setLoading(false);
    });
  }, [owner, repo, settings, demoMode]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      
      {/* GITHUB STYLE HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 pt-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          
          {/* Title Area */}
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-slate-400" />
            <h1 className="text-xl flex items-center gap-1.5 flex-wrap">
              <span className="text-indigo-400 hover:underline cursor-pointer">{owner}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-200 font-bold hover:underline cursor-pointer">{repo}</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full border border-slate-700 text-slate-400 text-[11px] font-medium ml-2">
              {repoMeta?.private ? 'Private' : 'Public'}
            </span>
          </div>

          {/* GitHub Tabs */}
          <div className="flex items-center gap-6 text-sm font-medium overflow-x-auto hide-scrollbar">
            {[
              { id: 'linkedin', icon: Zap, label: 'LinkedIn AI', highlight: true },
              { id: 'monitoring', icon: Activity, label: isAr ? 'المراقبة الأسبوعية' : 'Monitoring', highlight: false },
              { id: 'code', icon: FileCode2, label: 'Code' },
              { id: 'issues', icon: CircleDot, label: 'Issues' },
              { id: 'pulls', icon: GitBranch, label: 'Pull requests' },
              { id: 'actions', icon: PlayCircle, label: 'Actions' },
              { id: 'security', icon: Shield, label: 'Security' },
              { id: 'insights', icon: LineChart, label: 'Insights' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? (tab.highlight ? 'border-indigo-500 text-white' : 'border-[#f78166] text-white')
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${tab.highlight && activeTab === tab.id ? 'text-indigo-400' : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center pt-20">
          <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            
            {activeTab === 'linkedin' ? (
              // -----------------------------------------------------------
              // LINKEDIN AUTHORITY ENGINE - MASSIVE SAAS VIEW
              // -----------------------------------------------------------
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Hero section for AI Generation */}
                <div className="bg-gradient-to-br from-[#0d1117] via-slate-900 to-[#0d1117] border border-indigo-500/20 rounded-2xl p-6 md:p-10 relative overflow-hidden shadow-2xl">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
                  
                  <div className="relative z-10 max-w-3xl mx-auto text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-6">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                      {isAr ? 'مولد محتوى لينكد إن' : 'LinkedIn Content Engine'}
                    </h2>
                    <p className="text-slate-400 text-base md:text-lg">
                      {isAr 
                        ? 'قم بتحويل الكود، والتحديثات، والالتزامات البرمجية إلى منشورات احترافية تبرز خبرتك وتجذب فرصاً جديدة.' 
                        : 'Transform your code, commits, and updates into professional posts that showcase your expertise and attract opportunities.'}
                    </p>
                  </div>

                  <div className="relative z-10 max-w-2xl mx-auto bg-slate-950/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
                    <div className="space-y-6">
                      <div className="bg-[#0a0a0a] p-6 md:p-8 rounded-[2rem] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <label className="block text-lg font-bold text-white flex items-center gap-3 mb-6">
                           <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                             <Zap size={16} />
                           </div>
                           {isAr ? 'اختر زاوية النشر' : 'Select Narrative Angle'}
                        </label>
                        <IntentCards selectedIntent={intent} onSelectIntent={setIntent} lang={lang} />
                      </div>

                      <div className="bg-[#0a0a0a] p-6 md:p-8 rounded-[2rem] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] mt-6">
                        <label className="block text-sm font-bold text-slate-300 mb-4">{isAr ? 'الجمهور المستهدف' : 'Target Audience'}</label>
                        <div className="flex flex-wrap gap-3">
                          {[
                            { id: 'Software Engineers', label: isAr ? 'المهندسون' : 'Software Engineers' },
                            { id: 'CTOs/Tech Leads', label: isAr ? 'المدراء التقنيون' : 'CTOs/Tech Leads' },
                            { id: 'Recruiters/HR', label: isAr ? 'التوظيف / الموارد البشرية' : 'Recruiters/HR' },
                            { id: 'General Public', label: isAr ? 'الجمهور العام' : 'General Public' }
                          ].map(audience => (
                            <button
                              key={audience.id}
                              onClick={() => setTargetAudience(audience.id)}
                              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                                targetAudience === audience.id 
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-inner' 
                                  : 'bg-[#111] text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-300 hover:bg-[#161616]'
                              }`}
                            >
                              {audience.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        <button 
                          onClick={async () => {
                            setAnalyzing(true);
                            setRepoPhase('deep_scanning');
                            try {
                              const idToken = await user?.getIdToken();
                              const res = await fetch("/api/deep-scan", {
                                method: "POST",
                                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
                                body: JSON.stringify({ username: owner, token: settings.githubToken, repo: repo, lang: lang })
                              });
                              const data = await res.json();
                              if(res.ok) {
                                setAnalysisResult({
                                  post: data.post,
                                  suggestedComment: data.suggestedComment,
                                  synthesizedContext: data.synthesizedContext,
                                  repository: data.repository
                                });
                                setRepoPhase('result');
                              } else {
                                alert(data.error || 'Failed to perform deep scan');
                                setRepoPhase('idle');
                              }
                            } catch (err) {
                              console.error(err);
                              alert('Error performing deep scan');
                              setRepoPhase('idle');
                            } finally {
                              setAnalyzing(false);
                            }
                          }}
                          disabled={analyzing || repoPhase === 'generating' || repoPhase === 'deep_scanning'}
                          className="w-full glow-button bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {analyzing && repoPhase === 'deep_scanning' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                          {isAr ? 'فحص عميق (PRO)' : 'Deep Scan (PRO)'}
                        </button>
                        
                        <button 
                          onClick={async () => {
                            setAnalyzing(true);
                            try {
                              const idToken = await user?.getIdToken();
                              const res = await fetch("/api/analyze-repo", {
                                method: "POST",
                                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
                                body: JSON.stringify({ username: owner, token: settings.githubToken, repo: repo, projectDescription, intent, humanContext: targetAudience, lang: lang })
                              });
                              const data = await res.json();
                              if(res.ok) {
                                if (data.needsUserContext) {
                                  setNeedsContext(true);
                                  setRepoPhase('idle');
                                } else {
                                  if (data.angles) {
                                    setAngles(data.angles);
                                    setAnalysisToken(data.analysisToken || '');
                                    setAnalyzeConflicts(data.conflicts || []);
                                    setRepoPhase('angles');
                                    setNeedsContext(false);
                                  } else {
                                    setAngles([]);
                                    setRepoPhase('angles');
                                  }
                                }
                              } else {
                                alert(data.error || 'Failed to analyze repository');
                              }
                            } catch (err) {
                              console.error(err);
                              alert('Error analyzing repository');
                            } finally {
                              setAnalyzing(false);
                            }
                          }}
                          disabled={analyzing || repoPhase === 'generating' || repoPhase === 'deep_scanning' || (needsContext && !projectDescription)}
                          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {analyzing && repoPhase !== 'deep_scanning' ? <RefreshCw className="w-5 h-5 animate-spin text-slate-400" /> : <Search className="w-5 h-5 text-slate-400" />}
                          {isAr ? 'تحليل سريع' : 'Quick Analyze'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status/Phases */}
                
                {needsContext && repoPhase === 'idle' && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl slide-down max-w-2xl mx-auto">
                    <p className="font-bold text-amber-400 text-sm mb-2">{isAr ? "نحتاج لمزيد من السياق" : "More Context Needed"}</p>
                    <p className="text-amber-200/80 text-sm mb-4">{isAr ? "لم نجد README كافي. يرجى وصف مشروعك لتمكين الذكاء الاصطناعي من فهمه بشكل أفضل:" : "No sufficient README found. Describe your project so the AI can better understand it:"}</p>
                    <textarea 
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="..."
                      rows={4}
                      className="w-full bg-slate-900 border border-amber-500/20 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500/50 text-sm resize-none"
                    />
                  </div>
                )}

                {repoPhase === 'angles' && angles.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 slide-down max-w-3xl mx-auto shadow-xl">
                    <h3 className="text-lg font-bold text-slate-200 mb-6">{isAr ? "اختر زاوية الطرح:" : "Select Narrative Angle:"}</h3>
                    <div className="space-y-3">
                      {angles.map((angle) => (
                        <button
                          key={angle.id}
                          onClick={() => setSelectedAngleId(angle.id)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            selectedAngleId === angle.id 
                              ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                              : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${selectedAngleId === angle.id ? 'text-indigo-400' : 'text-slate-600'}`} />
                            <div>
                              <h5 className={`font-bold text-sm ${selectedAngleId === angle.id ? 'text-white' : 'text-slate-300'}`}>{angle.title}</h5>
                              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{angle.angleSummary}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedAngleId && angles.find(a => a.id === selectedAngleId)?.requiresHumanContext && (
                      <div className="mt-6 pt-6 border-t border-slate-800">
                        <label className="text-sm text-indigo-300 mb-3 block font-medium">
                          {angles.find(a => a.id === selectedAngleId)?.adaptiveQuestion}
                        </label>
                        <textarea 
                          value={humanContext}
                          onChange={(e) => setHumanContext(e.target.value)}
                          placeholder="..."
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 text-sm"
                        />
                      </div>
                    )}

                    <button 
                      onClick={async () => {
                        const angle = angles.find(a => a.id === selectedAngleId);
                        if (!angle) return;
                        
                        setRepoPhase('generating');
                        try {
                          const idToken = await user?.getIdToken();
                          const res = await fetch("/api/generate-post", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
                            body: JSON.stringify({ username: owner, token: settings.githubToken, repo: repo, projectDescription, analysisToken, angleId: angle.id, humanContext, lang })
                          });
                          
                          const data = await res.json();
                          if(res.ok) {
                            setAnalysisResult(data);
                            setRepoPhase('result');
                          } else {
                            alert(data.error || 'Failed to generate post');
                            setRepoPhase('angles');
                          }
                        } catch (err) {
                          console.error(err);
                          alert('Error generating post');
                          setRepoPhase('angles');
                        }
                      }}
                      disabled={!selectedAngleId || !analysisToken || (angles.find(a => a.id === selectedAngleId)?.requiresHumanContext && !humanContext)}
                      className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      {isAr ? 'إنشاء المنشور الآن' : 'Generate Post Now'}
                    </button>
                  </div>
                )}

                {repoPhase === 'generating' && (
                  <motion.div
                    key="step-3-loading"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="max-w-xl mx-auto text-center"
                  >
                    <TransformationLoader 
                      label={isAr ? "جاري صياغة المحتوى..." : "Drafting content..."}
                    />
                  </motion.div>
                )}

                {repoPhase === 'deep_scanning' && (
                  <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.15)] max-w-3xl mx-auto">
                    <DeepScanLoader repoName={`${owner}/${repo}`} isAr={isAr} />
                  </div>
                )}
                
                {/* FULL WIDTH RESULTS AREA (Demo Like) */}
                {repoPhase === 'result' && analysisResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="mt-8 border-t border-slate-800 pt-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8"
                  >
                    {/* Left: Metadata & Evidence */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Repo info */}
                      <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5">
                        <div className="flex flex-col gap-1 mb-4 pb-4 border-b border-white/5">
                          <h4 className="text-white font-bold text-lg flex items-center gap-2">
                            <GithubIcon size={18} className="text-indigo-400" />
                            {analysisResult.repository?.name || repoMeta?.name || repo}
                          </h4>
                          <p className="text-sm text-slate-400">{analysisResult.repository?.description || repoMeta?.description || ''}</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-start gap-2 text-sm">
                            <Target size={16} className="text-slate-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-slate-500 block text-xs">Intent</span>
                              <span className="text-indigo-300 font-medium">{angles.find(a => a.id === selectedAngleId)?.title || intent}</span>
                            </div>
                          </div>
                          
                          {analysisResult.evidence && analysisResult.evidence.length > 0 && (
                            <div className="flex items-start gap-2 text-sm pt-2">
                              <Zap size={16} className="text-slate-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-slate-500 block text-xs mb-1">{isAr ? 'الأدلة المستخرجة' : 'Evidence Discovered'}</span>
                                <ul className="text-emerald-400 space-y-2">
                                  {analysisResult.evidence.map((ev: any, idx: number) => (
                                    <li key={idx} className="flex gap-1.5 items-start">
                                      <span className="opacity-50 mt-1">•</span>
                                      <span className="leading-snug text-[13px]">
                                        {typeof ev === 'string' ? ev : ev.fact}
                                        {ev.source && <span className="block mt-0.5 text-[10px] font-mono text-emerald-400/50 uppercase tracking-wider">Source: {ev.source}</span>}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 shadow-lg">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{isAr ? 'هذا المحتوى مولد بواسطة الذكاء الاصطناعي. يرجى مراجعته وتعديله ليناسب شخصيتك.' : 'This is AI-generated content. Please review and adjust it to fit your personal voice.'}</p>
                      </div>

                      <button 
                        onClick={() => saveToFirestore('repo_analysis', { 
                          title: angles.find(a => a.id === selectedAngleId)?.title || 'LinkedIn Post Draft', 
                          post: analysisResult.post, 
                          suggestedComment: analysisResult.suggestedComment,
                          evidence: analysisResult.evidence,
                        }, setSavingAnalysis)}
                        disabled={savingAnalysis}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-4 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-lg"
                      >
                        <Save className="w-5 h-5 text-indigo-200" />
                        {savingAnalysis ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ في مكتبة المحتوى' : 'Save to Content Library')}
                      </button>
                    </div>

                    {/* Right: The Post */}
                    <div className="lg:col-span-7">
                      <motion.div 
                        initial={{ boxShadow: "0 0 0 rgba(99,102,241,0)", opacity: 0, y: 20 }}
                        animate={{ boxShadow: ["0 0 0 rgba(99,102,241,0)", "0 20px 40px rgba(0,0,0,0.1)", "0 0 0 rgba(99,102,241,0)"], opacity: 1, y: 0 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="bg-white border border-slate-200 rounded-2xl shadow-xl relative group overflow-hidden font-sans"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                        {/* Fake LinkedIn Header */}
                        <div className="p-4 md:p-5 pb-2">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                                <span className="text-white font-bold text-lg">
                                  {user?.displayName ? user.displayName.substring(0,2).toUpperCase() : 'ME'}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-[15px] font-bold text-slate-900 leading-tight hover:text-indigo-600 transition-colors cursor-pointer">{user?.displayName || (isAr ? 'أنت (المستخدم)' : 'You')}</h4>
                                <p className="text-[12px] text-slate-500 mt-0.5">{targetAudience}</p>
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                  <span>1m •</span>
                                  <Globe size={10} />
                                </div>
                              </div>
                            </div>
                            <div className="text-slate-400 self-start">
                              <LinkedinIcon size={24} className="text-[#0a66c2]" />
                            </div>
                          </div>
                          
                          <div className="relative group/post">
                            <textarea
                              value={analysisResult.post}
                              onChange={(e) => setAnalysisResult({ ...analysisResult, post: e.target.value })}
                              className="w-full min-h-[250px] bg-transparent text-[14px] leading-relaxed text-slate-800 mb-2 whitespace-pre-wrap resize-y focus:outline-none border-2 border-transparent focus:border-indigo-100 p-2 rounded-lg transition-colors hover:bg-slate-50"
                            />
                            <div className={`absolute top-2 ${lang === 'ar' ? 'left-2' : 'right-2'} opacity-0 group-hover/post:opacity-100 transition-opacity`}>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(analysisResult.post);
                                    setHasCopied(true);
                                    setTimeout(() => setHasCopied(false), 2000);
                                  }}
                                  className="p-2 bg-slate-800 text-white rounded-md shadow-md hover:bg-slate-700 flex items-center gap-1.5 text-xs font-bold"
                                >
                                  {hasCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                  {hasCopied ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}
                                </button>
                            </div>
                          </div>
                        </div>

                        {/* Suggested Comment Block */}
                        {analysisResult.suggestedComment ? (
                          <div className="px-4 md:px-5 pb-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative group/comment">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[9px] text-white font-bold">
                                  {user?.displayName ? user.displayName.substring(0,2).toUpperCase() : 'ME'}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{lang === 'ar' ? 'التعليق المقترح (يحتوي على الروابط)' : 'Suggested Comment (Links)'}</span>
                              </div>
                              <textarea
                                value={analysisResult.suggestedComment}
                                onChange={(e) => setAnalysisResult({ ...analysisResult, suggestedComment: e.target.value })}
                                className="w-full min-h-[80px] bg-transparent text-[13px] leading-relaxed text-slate-600 mb-1 whitespace-pre-wrap resize-y focus:outline-none border-2 border-transparent focus:border-indigo-100 p-2 rounded-lg transition-colors hover:bg-slate-100"
                              />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(analysisResult.suggestedComment);
                                  setHasCopiedComment(true);
                                  setTimeout(() => setHasCopiedComment(false), 2000);
                                }}
                                className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover/comment:opacity-100`}
                                title={lang === 'ar' ? 'نسخ التعليق' : 'Copy comment'}
                              >
                                {hasCopiedComment ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="px-4 md:px-5 pb-4">
                            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 border-dashed relative">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'لا يوجد روابط' : 'No Links Discovered'}</span>
                              </div>
                              <p className="text-[12px] text-slate-400">{lang === 'ar' ? 'لم يتم اكتشاف روابط في المستودع. يمكنك إضافة روابطك الخاصة هنا.' : 'No links discovered in the repository. You can add your own links here.'}</p>
                            </div>
                          </div>
                        )}

                        {/* Fake Actions Bar */}
                        <div className="px-4 md:px-5 py-2 border-t border-slate-100 flex items-center justify-between text-slate-500" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          <button className="flex items-center justify-center gap-1.5 hover:bg-slate-100 py-3 flex-1 rounded-lg transition-colors text-sm font-medium">
                            <ThumbsUp size={18} />
                            <span className="hidden sm:inline">{lang === 'ar' ? 'أعجبني' : 'Like'}</span>
                          </button>
                          <button className="flex items-center justify-center gap-1.5 hover:bg-slate-100 py-3 flex-1 rounded-lg transition-colors text-sm font-medium">
                            <MessageSquare size={18} />
                            <span className="hidden sm:inline">{lang === 'ar' ? 'تعليق' : 'Comment'}</span>
                          </button>
                          <button className="flex items-center justify-center gap-1.5 hover:bg-slate-100 py-3 flex-1 rounded-lg transition-colors text-sm font-medium">
                            <Repeat2 size={18} />
                            <span className="hidden sm:inline">{lang === 'ar' ? 'إعادة نشر' : 'Repost'}</span>
                          </button>
                          <button className="flex items-center justify-center gap-1.5 hover:bg-slate-100 py-3 flex-1 rounded-lg transition-colors text-sm font-medium">
                            <Send size={18} />
                            <span className="hidden sm:inline">{lang === 'ar' ? 'إرسال' : 'Send'}</span>
                          </button>
                        </div>
                        
                        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          <button
                            onClick={() => { setRepoPhase('idle'); }}
                            className="text-xs text-slate-500 hover:text-indigo-600 font-bold transition-colors flex items-center gap-1.5"
                          >
                            <RefreshCw size={14} />
                            {lang === 'ar' ? 'إنشاء منشور جديد' : 'Generate New Post'}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : activeTab === 'monitoring' ? (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-[#0d1117] via-slate-900 to-[#0d1117] border border-slate-800 rounded-2xl p-6 md:p-10 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                        {isAr ? 'المراقبة الأسبوعية' : 'Weekly Monitoring'}
                      </h2>
                      <p className="text-slate-400">
                        {isAr ? 'احصل على منشورات تلخص تقدمك أسبوعياً وتبرز التزامك بالعمل المستمر.' : 'Get weekly posts summarizing your progress and showcasing your consistent effort.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0a0a0a] p-6 md:p-8 rounded-[2rem] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] space-y-8">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{isAr ? 'تفعيل المراقبة' : 'Enable Monitoring'}</h3>
                        <p className="text-sm text-slate-400">{isAr ? 'سيقوم النظام بجمع البيانات وتحليلها بشكل أسبوعي لإنشاء مسودة.' : 'The system will collect and analyze data weekly to create a draft.'}</p>
                      </div>
                      <button onClick={() => setMonitoringEnabled(!monitoringEnabled)} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                        {monitoringEnabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} className="text-slate-600" />}
                      </button>
                    </div>

                    {monitoringEnabled && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-4 border-t border-slate-800">
                        <h4 className="text-slate-200 font-bold mb-4 flex items-center gap-2"><Settings2 size={18} /> {isAr ? 'ماذا نراقب؟' : 'What to monitor?'}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { id: 'monitorCommits', label: isAr ? 'الالتزامات (Commits)' : 'Commits' },
                            { id: 'monitorIssues', label: isAr ? 'المشاكل (Issues)' : 'Issues' },
                            { id: 'monitorPullRequests', label: isAr ? 'طلبات السحب (PRs)' : 'Pull Requests' }
                          ].map(opt => (
                            <label key={opt.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${monitoringConfig[opt.id as keyof typeof monitoringConfig] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={monitoringConfig[opt.id as keyof typeof monitoringConfig]} 
                                onChange={(e) => setMonitoringConfig({ ...monitoringConfig, [opt.id]: e.target.checked })}
                              />
                              {monitoringConfig[opt.id as keyof typeof monitoringConfig] ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-slate-700" />}
                              <span className="font-semibold text-sm">{opt.label}</span>
                            </label>
                          ))}
                        </div>

                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl mt-6">
                          <p className="text-sm text-indigo-300">
                            <Bell size={16} className="inline mr-2" />
                            {isAr ? 'سيتم استخدام "زاوية النشر" و "الجمهور المستهدف" المحددة حالياً في تبويب LinkedIn AI لتوليد المنشورات المستقبلية.' : 'The currently selected "Narrative Angle" and "Target Audience" from the LinkedIn AI tab will be used for future generated posts.'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button 
                      disabled={savingMonitoring}
                      onClick={async () => {
                        if (!user || !owner || !repo) return;
                        setSavingMonitoring(true);
                        try {
                          const projectId = `${owner}_${repo}`;
                          
                          // Make sure the project exists first, or save it if it doesn't
                          await firestoreService.saveProject(user.uid, {
                            owner: owner,
                            repo: repo,
                            fullName: `${owner}/${repo}`,
                            description: repoMeta?.description || '',
                            language: repoMeta?.language || '',
                          });

                          await firestoreService.updateProject(user.uid, projectId, {
                            monitoringEnabled,
                            monitoringConfig: {
                              ...monitoringConfig,
                              intent,
                              targetAudience
                            }
                          });
                          alert(isAr ? 'تم حفظ إعدادات المراقبة بنجاح!' : 'Monitoring settings saved successfully!');
                        } catch (err) {
                          console.error(err);
                          alert('Error saving monitoring settings');
                        } finally {
                          setSavingMonitoring(false);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                      {savingMonitoring ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {isAr ? 'حفظ الإعدادات' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // -----------------------------------------------------------
              // GITHUB REPO VIEW (For Code, Issues, etc.)
              // -----------------------------------------------------------
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* LEFT COLUMN: GITHUB FILE EXPLORER (75%) */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* File Explorer */}
                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#0d1117]">
                    {/* Latest Commit Header */}
                    <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                          <GitCommit className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-300 font-medium truncate max-w-md">
                          {commits[0]?.commit.message || 'Initial commit'}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{commits[0] ? new Date(commits[0].commit.author.date).toLocaleDateString() : ''}</span>
                        <strong className="text-slate-300">{commits.length}</strong> commits
                      </div>
                    </div>
                    
                    {/* Files List */}
                    <div className="divide-y divide-slate-800/50">
                      {repoFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/20 transition-colors cursor-pointer group">
                          {file.type === 'dir' ? (
                            <Folder className="w-4 h-4 text-[#79c0ff]" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-500" />
                          )}
                          <span className="text-sm text-slate-300 group-hover:text-indigo-400 transition-colors truncate">
                            {file.name}
                          </span>
                          <span className="ml-auto text-xs text-slate-600">Update {file.name}</span>
                        </div>
                      ))}
                      {repoFiles.length === 0 && (
                        <div className="p-4 text-sm text-slate-500 text-center">No files found.</div>
                      )}
                    </div>
                  </div>

                  {/* README Box */}
                  {readme && (
                    <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#0d1117]">
                      <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-2 sticky top-0 bg-[#0d1117] z-10">
                        <List className="w-4 h-4 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-200">README.md</h3>
                      </div>
                      <div className="p-8 prose prose-invert prose-sm md:prose-base max-w-none text-slate-300 font-sans">
                        <pre className="whitespace-pre-wrap bg-transparent border-0 p-0 text-slate-300 font-sans">{readme}</pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: GITHUB ABOUT */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* About Section (GitHub native look) */}
                  <div className="border-b border-slate-800 pb-6">
                    <h3 className="text-slate-200 font-semibold mb-3">About</h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                      {repoMeta?.description || 'No description, website, or topics provided.'}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Star className="w-4 h-4 text-slate-500" />
                        <strong className="text-slate-300">{repoMeta?.stargazers_count || 0}</strong> stars
                      </div>
                      {repoMeta?.language && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Code2 className="w-4 h-4 text-slate-500" />
                          <strong className="text-slate-300">{repoMeta.language}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};

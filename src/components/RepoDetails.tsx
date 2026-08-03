import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, FolderGit2, GitCommit, FileText, RefreshCw, Save, Copy, Zap, Lock, BookOpen, CircleDot, PlayCircle, Shield, LineChart, FileCode2, Folder, Clock, CheckCircle2 } from 'lucide-react';
import { fetchReadme } from '../services/githubService';
import { useAuth } from '../application/AuthContext';
import { firestoreService, DraftData } from '../services/firestoreService';
import { DeepScanLoader } from './DeepScan/DeepScanLoader';

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

  const [analyzingCommits, setAnalyzingCommits] = useState(false);
  const [commitAnalysis, setCommitAnalysis] = useState<any>(null);
  
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [savingCommitAnalysis, setSavingCommitAnalysis] = useState(false);

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
              { id: 'code', icon: FileCode2, label: 'Code' },
              { id: 'issues', icon: CircleDot, label: 'Issues' },
              { id: 'pulls', icon: GitBranch, label: 'Pull requests' },
              { id: 'actions', icon: PlayCircle, label: 'Actions' },
              { id: 'security', icon: Shield, label: 'Security' },
              { id: 'insights', icon: LineChart, label: 'Insights' },
              { id: 'linkedin', icon: Zap, label: 'LinkedIn AI', highlight: true }
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

              {/* RIGHT COLUMN: LINKEDIN AUTHORITY ENGINE (25%) */}
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

                {/* THE LINKEDIN AI WIDGET */}
                <div className="bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                      <Zap className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white">LinkedIn Authority</h3>
                  </div>

                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                    {isAr ? 'حوّل تحديثات هذا المستودع إلى منشورات لينكد إن احترافية تبني علامتك التجارية بضغطة زر.' : 'Transform repository updates into professional LinkedIn posts to build your personal brand.'}
                  </p>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-300 block">{isAr ? 'زاوية النشر' : 'Narrative Angle'}</label>
                    <div className="relative">
                      <select 
                        value={intent}
                        onChange={(e) => setIntent(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-300 appearance-none focus:outline-none focus:border-indigo-500"
                        disabled={analyzing || repoPhase === 'generating'}
                      >
                        <option value="auto">{isAr ? "أفضل زاوية تلقائياً" : "Auto (Recommended)"}</option>
                        <option value="project">{isAr ? "أعلن عن المشروع" : "Project / Feature"}</option>
                        <option value="technical_decision">{isAr ? "قرار تقني" : "Technical Decision"}</option>
                        <option value="challenge_lesson">{isAr ? "شارك درساً" : "Challenge / Lesson"}</option>
                        <option value="progress_update">{isAr ? "تحديث أو تقدم" : "Progress Update"}</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <div className="pt-2">
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
                        className="w-full glow-button bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {analyzing && repoPhase === 'deep_scanning' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {isAr ? 'فحص عميق (PRO)' : 'Deep Scan (PRO)'}
                      </button>
                    </div>

                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-slate-800"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-600 text-xs font-medium">OR</span>
                      <div className="flex-grow border-t border-slate-800"></div>
                    </div>

                    <button 
                      onClick={async () => {
                        setAnalyzing(true);
                        try {
                          const idToken = await user?.getIdToken();
                          const res = await fetch("/api/analyze-repo", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
                            body: JSON.stringify({ username: owner, token: settings.githubToken, repo: repo, projectDescription, intent, lang: lang })
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
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {analyzing && repoPhase !== 'deep_scanning' ? <RefreshCw className="w-4 h-4 animate-spin text-slate-400" /> : <Search className="w-4 h-4 text-slate-400" />}
                      {isAr ? 'تحليل سريع' : 'Quick Analyze'}
                    </button>
                  </div>
                </div>

                {/* GENERATION RESULTS AREA */}
                
                {needsContext && repoPhase === 'idle' && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl slide-down">
                    <p className="font-bold text-amber-400 text-xs mb-1">{isAr ? "نحتاج لمزيد من السياق" : "More Context Needed"}</p>
                    <p className="text-amber-200/80 text-xs mb-3">{isAr ? "لم نجد README كافي. صف مشروعك:" : "No sufficient README found. Describe your project:"}</p>
                    <textarea 
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="..."
                      rows={3}
                      className="w-full bg-slate-900 border border-amber-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500/50 text-xs resize-none"
                    />
                  </div>
                )}

                {repoPhase === 'angles' && angles.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 slide-down">
                    <h3 className="text-xs font-bold text-slate-300 mb-3">{isAr ? "اختر زاوية الطرح:" : "Select Narrative Angle:"}</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                      {angles.map((angle) => (
                        <button
                          key={angle.id}
                          onClick={() => setSelectedAngleId(angle.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedAngleId === angle.id 
                              ? 'bg-indigo-500/20 border-indigo-500/50' 
                              : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${selectedAngleId === angle.id ? 'text-indigo-400' : 'text-slate-600'}`} />
                            <div>
                              <h5 className={`font-bold text-xs ${selectedAngleId === angle.id ? 'text-white' : 'text-slate-300'}`}>{angle.title}</h5>
                              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{angle.angleSummary}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedAngleId && angles.find(a => a.id === selectedAngleId)?.requiresHumanContext && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <label className="text-xs text-indigo-300 mb-2 block font-medium">
                          {angles.find(a => a.id === selectedAngleId)?.adaptiveQuestion}
                        </label>
                        <textarea 
                          value={humanContext}
                          onChange={(e) => setHumanContext(e.target.value)}
                          placeholder="..."
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
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
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {isAr ? 'إنشاء المنشور الآن' : 'Generate Post Now'}
                    </button>
                  </div>
                )}

                {repoPhase === 'generating' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                    <p className="text-xs font-medium text-slate-400">{isAr ? "جاري صياغة المحتوى..." : "Drafting content..."}</p>
                  </div>
                )}

                {repoPhase === 'deep_scanning' && (
                  <div className="bg-slate-900 border border-indigo-500/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                    <DeepScanLoader repoName={`${owner}/${repo}`} isAr={isAr} />
                  </div>
                )}

              </div>
            </div>

            {/* FULL WIDTH RESULTS AREA (Below Columns if needed, but for now we put it inline or overlay, actually let's put it as a wide panel here if results exist) */}
            {repoPhase === 'result' && analysisResult && (
              <div className="mt-8 border-t border-slate-800 pt-8 slide-down">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{isAr ? 'المنشور جاهز للنشر' : 'Post Ready for Publication'}</h2>
                    <p className="text-sm text-slate-400">{isAr ? 'قم بمراجعة المسودة وتعديلها أو نشرها مباشرة.' : 'Review and edit your draft, or publish directly.'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden">
                      <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400" /> {isAr ? 'مسودة المنشور' : 'Post Draft'}
                        </h3>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(analysisResult.post);
                            alert(isAr ? "تم نسخ المنشور!" : "Post copied!");
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-md text-xs font-bold transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {isAr ? 'نسخ' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-6 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                        {analysisResult.post}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                       <div className="border-b border-slate-800 px-4 py-3 flex justify-between items-center">
                        <h3 className="text-xs font-semibold text-slate-400">{isAr ? 'التعليق الأول المقترح' : 'First Comment'}</h3>
                         {analysisResult.suggestedComment && (
                          <button onClick={() => { navigator.clipboard.writeText(analysisResult.suggestedComment); }} className="text-slate-500 hover:text-slate-300 transition-colors">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="p-4 text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                        {analysisResult.suggestedComment || (isAr ? 'لا يوجد روابط لرفقها.' : 'No links to attach.')}
                      </div>
                    </div>

                    <button 
                      onClick={() => saveToFirestore('repo_analysis', { 
                        title: angles.find(a => a.id === selectedAngleId)?.title || 'LinkedIn Post Draft', 
                        post: analysisResult.post, 
                        suggestedComment: analysisResult.suggestedComment,
                        evidence: analysisResult.evidence,
                      }, setSavingAnalysis)}
                      disabled={savingAnalysis}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 text-slate-400" />
                      {savingAnalysis ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ في مكتبة المحتوى' : 'Save to Content Library')}
                    </button>
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

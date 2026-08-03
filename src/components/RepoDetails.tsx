import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, FolderGit2, GitCommit, FileText, RefreshCw, Save } from 'lucide-react';
import { fetchReadme } from '../services/githubService';
import { useAuth } from '../application/AuthContext';
import { firestoreService, DraftData } from '../services/firestoreService';

export const RepoDetails = ({ lang, settings, demoMode }: any) => {
  const { user } = useAuth();
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [commits, setCommits] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [readme, setReadme] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null); // For the generated post

  // New Intelligence Engine State
  const [repoPhase, setRepoPhase] = useState<'idle' | 'angles' | 'generating' | 'result'>('idle');
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
        language: '',
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
      setCommits([
        { commit: { message: "refactor: optimize rendering pipeline", author: { date: new Date().toISOString() } } }
      ]);
      setBranches([{ name: 'main' }]);
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
      fetchReadme(owner, repo, settings.githubToken, false).catch(() => '')
    ]).then(([commitsData, branchesData, readmeData]) => {
      setCommits(Array.isArray(commitsData) ? commitsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      if (Array.isArray(branchesData) && branchesData.length > 0) {
        setSelectedBranch(branchesData.find(b => b.name === 'main' || b.name === 'master')?.name || branchesData[0].name);
      }
      setReadme(readmeData);
      setLoading(false);
    });
  }, [owner, repo, settings, demoMode]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button onClick={() => navigate('/repositories')} className="hover:text-white transition-colors">
          {isAr ? 'المستودعات' : 'Repositories'}
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white font-bold">{repo}</span>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl shadow-slate-900/50">
        <div className="flex items-center gap-3 mb-6">
          <FolderGit2 className="w-8 h-8 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-black text-white">{repo}</h1>
            <p className="text-slate-400 text-sm">{owner}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              
              <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                  <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" /> README
                  </h2>
                  
                  <div className="flex gap-2 items-center">
                    <select 
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors text-xs appearance-none cursor-pointer"
                      disabled={analyzing || repoPhase === 'generating'}
                    >
                      <option value="auto">{isAr ? "أفضل زاوية تلقائياً" : "Auto (Recommended)"}</option>
                      <option value="project">{isAr ? "أعلن عن المشروع" : "Project / Feature"}</option>
                      <option value="technical_decision">{isAr ? "قرار تقني" : "Technical Decision"}</option>
                      <option value="challenge_lesson">{isAr ? "شارك درساً" : "Challenge / Lesson"}</option>
                      <option value="progress_update">{isAr ? "تحديث أو تقدم" : "Progress Update"}</option>
                    </select>

                    <button 
                      onClick={async () => {
                        setAnalyzing(true);
                        try {
                          const idToken = await user?.getIdToken();
                          const res = await fetch("/api/analyze-repo", {
                            method: "POST",
                            headers: { 
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${idToken}`
                            },
                            body: JSON.stringify({
                              username: owner,
                              token: settings.githubToken,
                              repo: repo,
                              projectDescription,
                              intent,
                              lang: lang
                            })
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
                      disabled={analyzing || repoPhase === 'generating' || (needsContext && !projectDescription)}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {analyzing ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : (isAr ? 'تحليل المستودع' : 'Analyze Repository')}
                    </button>
                  </div>
                </div>
                
                {needsContext && repoPhase === 'idle' && (
                  <div className="mb-4">
                    <div className="mb-3 mt-2 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-xl">
                      <p className="font-bold mb-1">{isAr ? "نحتاج لمزيد من السياق" : "More Context Needed"}</p>
                      <p className="text-amber-200/80">{isAr ? "لم نجد README. صف مشروعك بجملة:" : "No README found. Describe your project:"}</p>
                    </div>
                    <textarea 
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="..."
                      maxLength={200}
                      rows={2}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors resize-none text-sm"
                    />
                  </div>
                )}

                {repoPhase === 'angles' && angles.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h3 className="text-sm font-bold text-white mb-2">{isAr ? "اختر الزاوية المناسبة:" : "Select a Narrative Angle:"}</h3>
                    {angles.map((angle) => (
                      <button
                        key={angle.id}
                        onClick={() => setSelectedAngleId(angle.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          selectedAngleId === angle.id 
                            ? 'bg-indigo-500/20 border-indigo-500/50' 
                            : 'bg-slate-900 border-white/5 hover:border-white/10 hover:bg-slate-800'
                        }`}
                      >
                        <h5 className="font-bold text-white text-sm">{angle.title}</h5>
                        <p className="text-xs text-slate-400 mt-1">{angle.angleSummary}</p>
                      </button>
                    ))}
                    
                    {analyzeConflicts.length > 0 && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <h4 className="text-red-400 text-xs font-bold mb-2">{isAr ? 'تعارضات مكتشفة:' : 'Detected Conflicts:'}</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          {analyzeConflicts.map((c, i) => (
                            <li key={i} className="text-xs text-red-300/80">
                              <span className="font-semibold">{c.claim}</span> - {c.severity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedAngleId && angles.find(a => a.id === selectedAngleId)?.requiresHumanContext && (
                      <div className="mt-3">
                        <label className="text-xs text-slate-400 mb-1 block">
                          {angles.find(a => a.id === selectedAngleId)?.adaptiveQuestion}
                        </label>
                        <textarea 
                          value={humanContext}
                          onChange={(e) => setHumanContext(e.target.value)}
                          placeholder="..."
                          rows={2}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none text-sm"
                        />
                      </div>
                    )}

                    <div className="flex justify-end mt-4">
                      <button 
                        onClick={async () => {
                          const angle = angles.find(a => a.id === selectedAngleId);
                          if (!angle) return;
                          
                          setRepoPhase('generating');
                          try {
                            const idToken = await user?.getIdToken();
                            const res = await fetch("/api/generate-post", {
                              method: "POST",
                              headers: { 
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${idToken}`
                              },
                              body: JSON.stringify({
                                username: owner,
                                token: settings.githubToken,
                                repo: repo,
                                projectDescription,
                                analysisToken,
                                angleId: angle.id,
                                humanContext,
                                lang
                              })
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
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        {isAr ? 'اكتب المنشور' : 'Generate Post'}
                      </button>
                    </div>
                  </div>
                )}
                
                {repoPhase === 'generating' && (
                  <div className="py-8 flex justify-center flex-col items-center gap-3">
                    <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                    <p className="text-sm text-slate-400">{isAr ? "جاري صياغة المنشور..." : "Generating Post..."}</p>
                  </div>
                )}

                {repoPhase === 'result' && analysisResult ? (
                  <div className="space-y-4 mt-4">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-2">{isAr ? 'مسودة المنشور' : 'Draft Content'}</h3>
                      <div className="bg-slate-900 p-4 rounded-xl border border-white/10 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {analysisResult.post}
                      </div>
                    </div>
                    {analysisResult.suggestedComment && (
                      <div className="mt-4">
                        <h3 className="text-sm font-bold text-white mb-2">{isAr ? 'التعليق المقترح (يحتوي على الروابط)' : 'Suggested Comment (Links)'}</h3>
                        <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/30 text-sm text-indigo-200 whitespace-pre-wrap leading-relaxed">
                          {analysisResult.suggestedComment}
                        </div>
                      </div>
                    )}
                    {analysisResult.evidence?.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{isAr ? 'الأدلة المستخدمة' : 'Used Evidence'}</h3>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.evidence.map((ev: any, i: number) => (
                            <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 text-[10px] rounded border border-white/5 truncate max-w-xs">
                              {ev.fact}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysisResult.warnings?.length > 0 && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <h4 className="text-amber-400 text-xs font-bold mb-2">{isAr ? 'تحذيرات:' : 'Warnings:'}</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          {analysisResult.warnings.map((w: string, i: number) => (
                            <li key={i} className="text-xs text-amber-300/80">{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={() => saveToFirestore('repo_analysis', { 
                          title: angles.find(a => a.id === selectedAngleId)?.title, 
                          post: analysisResult.post, 
                          suggestedComment: analysisResult.suggestedComment,
                          evidence: analysisResult.evidence,
                          warnings: analysisResult.warnings
                        }, setSavingAnalysis)}
                        disabled={savingAnalysis}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingAnalysis ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ كمسودة' : 'Save Draft')}
                      </button>
                    </div>
                  </div>
                ) : repoPhase === 'idle' && !needsContext ? (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-400 max-h-64 overflow-y-auto custom-scrollbar pr-2 mt-4">
                    <pre className="whitespace-pre-wrap font-sans text-xs">{readme || 'No README found.'}</pre>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-indigo-400" /> Recent Commits
                  </h2>
                  <button 
                    onClick={async () => {
                      if (commits.length === 0) return;
                      setAnalyzingCommits(true);
                      try {
                        const idToken = await user?.getIdToken();
                        const res = await fetch("/api/analyze-commits", {
                          method: "POST",
                          headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${idToken}`
                          },
                          body: JSON.stringify({
                            commits: commits.map((c: any) => ({ sha: c.sha, message: c.commit.message })),
                            repo: repo,
                            lang: lang
                          })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setCommitAnalysis(data);
                        } else {
                          alert('Failed to analyze commits');
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Error analyzing commits');
                      } finally {
                        setAnalyzingCommits(false);
                      }
                    }}
                    disabled={analyzingCommits || commits.length === 0}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {analyzingCommits ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : (isAr ? 'تحديث تقني' : 'Generate Update')}
                  </button>
                </div>
                
                {commitAnalysis ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">{commitAnalysis.title}</h3>
                      <div className="bg-slate-900 p-3 rounded-lg border border-white/10 text-sm text-slate-300 whitespace-pre-wrap">
                        {commitAnalysis.technicalUpdate}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 mb-1">Changelog</h3>
                      <div className="text-xs text-slate-400 whitespace-pre-wrap">
                        {commitAnalysis.changelog}
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={() => saveToFirestore('commit_update', commitAnalysis, setSavingCommitAnalysis)}
                        disabled={savingCommitAnalysis}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingCommitAnalysis ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ كمسودة' : 'Save Draft')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commits.map((c: any, i: number) => (
                      <div key={i} className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-slate-300 text-xs truncate" title={c.commit.message}>
                            {c.commit.message}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(c.commit.author.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {commits.length === 0 && (
                      <p className="text-xs text-slate-500">No commits found.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

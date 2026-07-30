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
  const [analysisResult, setAnalysisResult] = useState<any>(null);
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
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" /> README
                  </h2>
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
                            username: settings.githubUsername,
                            token: settings.githubToken,
                            repo: repo,
                            branch: selectedBranch,
                            lang: lang
                          })
                        });
                        if(res.ok) {
                          const data = await res.json();
                          setAnalysisResult(data);
                        } else {
                          alert('Failed to analyze repository');
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Error analyzing repository');
                      } finally {
                        setAnalyzing(false);
                      }
                    }}
                    disabled={analyzing}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {analyzing ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : (isAr ? 'تحليل المستودع' : 'Analyze Repository')}
                  </button>
                </div>
                
                {analysisResult ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">Summary</h3>
                      <p className="text-sm text-slate-400">{analysisResult.summary}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">Architecture</h3>
                      <p className="text-sm text-slate-400">{analysisResult.architecture}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">Tech Stack</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.techStack?.map((tech: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-md border border-indigo-500/20">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">Draft Content</h3>
                      <div className="bg-slate-900 p-3 rounded-lg border border-white/10 text-sm text-slate-300 whitespace-pre-wrap">
                        {analysisResult.potentialContent}
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={() => saveToFirestore('repo_analysis', analysisResult, setSavingAnalysis)}
                        disabled={savingAnalysis}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingAnalysis ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ كمسودة' : 'Save Draft')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-400 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    <pre className="whitespace-pre-wrap font-sans text-xs">{readme || 'No README found.'}</pre>
                  </div>
                )}
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

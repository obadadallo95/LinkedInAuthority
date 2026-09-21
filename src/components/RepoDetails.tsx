import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, FolderGit2, GitCommit, FileText, RefreshCw, Save, Copy, Zap, Lock, BookOpen, FileCode2, Folder, Clock, CheckCircle2, List, Star, Code2, ChevronDown, Search, Target, AlertTriangle, Globe, Check, Activity, Bell, Settings2, ToggleLeft, ToggleRight, FileCheck2, Link2 } from 'lucide-react';
import { useAuth } from '../application/AuthContext';
import { recordAuthenticatedProductEvent } from '../utils/productTelemetry';
import { firestoreService, DraftData } from '../services/firestoreService';
import { DeepScanLoader } from './DeepScan/DeepScanLoader';
import { IntentCards } from './IntentCards';
import { TransformationLoader } from './TransformationLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { isBrowserE2E } from '../utils/e2e';

const LinkedinIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const GithubIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/>
  </svg>
);

type RepoDetailsCacheEntry = {
  commits: any[];
  branches: any[];
  repoFiles: any[];
  repoMeta: any;
  readme: string;
  cachedAt: number;
};

// Opening the same repository again should not spend five more anonymous
// GitHub requests while the user is still in the same working session.
const repoDetailsCache = new Map<string, RepoDetailsCacheEntry>();
const REPO_DETAILS_CACHE_TTL_MS = 5 * 60 * 1000;

export function getSafeRepoOperationError(
  lang: 'ar' | 'en' | 'de',
  operation: 'deep_scan' | 'commits' | 'analysis' | 'generation',
  status?: number,
) {
  if (status === 429) {
    return lang === 'ar'
      ? 'تم الوصول إلى حد التحليل اليومي. حاول مرة أخرى لاحقاً.'
      : lang === 'de'
        ? 'Das tägliche Analyse-Limit wurde erreicht. Versuchen Sie es später erneut.'
        : 'The daily analysis limit was reached. Please try again later.';
  }

  if (status === 401 || status === 403) {
    return lang === 'ar'
      ? 'انتهت جلسة الدخول أو لا تملك صلاحية الوصول. سجّل الدخول وحاول مرة أخرى.'
      : lang === 'de'
        ? 'Deine Sitzung ist abgelaufen oder der Zugriff wurde verweigert. Melde dich erneut an.'
        : 'Your session expired or access was denied. Sign in again and retry.';
  }

  const labels = {
    deep_scan: { ar: 'الفحص العميق', de: 'der tiefe Scan', en: 'the deep scan' },
    commits: { ar: 'تحليل الالتزامات', de: 'die Commit-Analyse', en: 'commit analysis' },
    analysis: { ar: 'تحليل المستودع', de: 'die Repository-Analyse', en: 'repository analysis' },
    generation: { ar: 'إنشاء المسودة', de: 'die Entwurfserstellung', en: 'draft generation' },
  }[operation];

  return lang === 'ar'
    ? `تعذر إكمال ${labels.ar} حالياً. تحقق من الاتصال وحاول مرة أخرى.`
    : lang === 'de'
      ? `${labels.de} ist derzeit nicht verfügbar. Prüfe die Verbindung und versuche es erneut.`
      : `${labels.en} is temporarily unavailable. Check the connection and retry.`;
}

export const RepoDetails = ({ lang, settings, demoMode }: any) => {
  const { user } = useAuth();
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const isDe = lang === 'de';
  const ui = {
    login: isAr ? 'يجب تسجيل الدخول لحفظ المسودة' : isDe ? 'Zum Speichern eines Entwurfs musst du dich anmelden.' : 'You must be logged in to save drafts.',
    saved: isAr ? 'تم حفظ المسودة بنجاح' : isDe ? 'Entwurf erfolgreich gespeichert' : 'Draft saved successfully',
    saveError: isAr ? 'حدث خطأ أثناء الحفظ' : isDe ? 'Beim Speichern ist ein Fehler aufgetreten' : 'Error saving draft',
    generation: isAr ? 'خيارات التوليد' : isDe ? 'Generierungsoptionen' : 'Generation Options',
    deepScan: isAr ? 'فحص عميق قائم على الأدلة' : isDe ? 'Evidenzbasierter Repository-Scan' : 'Evidence-backed repository scan',
    deepScanDescription: isAr ? 'تحليل شامل للكود، README، لاستخراج أفضل قصة لمشاركتها.' : isDe ? 'Code und README werden umfassend analysiert, um eine belastbare Geschichte zu finden.' : 'Comprehensive analysis of code and README to extract the best story.',
    recentCommits: isAr ? 'توليد بناءً على التحديثات الأخيرة' : isDe ? 'Aus letzten Commits generieren' : 'Generate from Recent Commits',
    recentCommitsDescription: isAr ? 'التركيز على آخر التغييرات والإضافات البرمجية.' : isDe ? 'Fokus auf die neuesten Codeänderungen und Ergänzungen.' : 'Focus on the latest code changes and additions.',
    tutorial: isAr ? 'كتابة درس تعليمي / إعلان' : isDe ? 'Tutorial oder Ankündigung schreiben' : 'Write Tutorial or Announcement',
    tutorialDescription: isAr ? 'استخدام المستودع كمرجع لدرس تعليمي أو مقال.' : isDe ? 'Das Repository als Grundlage für ein Tutorial oder einen Artikel nutzen.' : 'Use repository as a reference for a tutorial or article.',
    moreContext: isAr ? 'نحتاج لمزيد من السياق' : isDe ? 'Mehr Kontext erforderlich' : 'More Context Needed',
    contextDescription: isAr ? 'لم نجد README كافي. يرجى وصف مشروعك لتمكين الذكاء الاصطناعي من فهمه بشكل أفضل:' : isDe ? 'Das README liefert nicht genügend Kontext. Beschreibe dein Projekt, damit die KI es besser versteht:' : 'No sufficient README found. Describe your project so the AI can better understand it:',
    chooseAngle: isAr ? 'اختر زاوية الطرح:' : isDe ? 'Erzählwinkel auswählen:' : 'Select Narrative Angle:',
    generate: isAr ? 'إنشاء المنشور الآن' : isDe ? 'Entwurf jetzt erstellen' : 'Generate Post Now',
    drafting: isAr ? 'جاري صياغة المحتوى...' : isDe ? 'Entwurf wird erstellt …' : 'Drafting content...',
    intent: isAr ? 'الهدف' : isDe ? 'Absicht' : 'Intent',
    evidence: isAr ? 'الأدلة المستخرجة' : isDe ? 'Gefundene Nachweise' : 'Evidence Discovered',
    aiNotice: isAr ? 'هذا المحتوى مولد بواسطة الذكاء الاصطناعي. يرجى مراجعته وتعديله ليناسب شخصيتك.' : isDe ? 'Dies ist ein KI-generierter Entwurf. Bitte prüfe und passe ihn an deine eigene Stimme an.' : 'This is AI-generated content. Please review and adjust it to fit your personal voice.',
    saving: isAr ? 'جاري الحفظ...' : isDe ? 'Wird gespeichert …' : 'Saving...',
    saveLibrary: isAr ? 'حفظ في مكتبة المحتوى' : isDe ? 'In der Inhaltsbibliothek speichern' : 'Save to Content Library',
    you: isAr ? 'أنت (المستخدم)' : isDe ? 'Du' : 'You',
    copied: isAr ? 'تم النسخ' : isDe ? 'Kopiert' : 'Copied',
    copy: isAr ? 'نسخ' : isDe ? 'Kopieren' : 'Copy',
    copyError: isAr ? 'تعذر النسخ. حدّد النص وانسخه يدوياً.' : isDe ? 'Kopieren fehlgeschlagen. Markiere den Text und kopiere ihn manuell.' : 'Copy failed. Select the text and copy it manually.',
    draftPostLabel: isAr ? 'نص المسودة' : isDe ? 'Entwurfstext' : 'Draft post',
    suggestedCommentLabel: isAr ? 'ملاحظة الروابط المقترحة' : isDe ? 'Vorgeschlagener Link-Hinweis' : 'Suggested comment',
    audienceLabel: (value: string) => ({
      'Software Engineers': isAr ? 'المهندسون البرمجيون' : isDe ? 'Softwareentwickler' : 'Software Engineers',
      'CTOs/Tech Leads': isAr ? 'مديرو التقنية والقادة التقنيون' : isDe ? 'CTOs / technische Leads' : 'CTOs / Tech Leads',
      'Recruiters/HR': isAr ? 'التوظيف والموارد البشرية' : isDe ? 'Recruiting / HR' : 'Recruiters / HR',
      'General Public': isAr ? 'الجمهور العام' : isDe ? 'Allgemeine Öffentlichkeit' : 'General Public',
    }[value] || value),
    linkNote: isAr ? 'ملاحظة روابط اختيارية' : isDe ? 'Optionaler Link-Hinweis' : 'Optional Link Note',
    noLinks: isAr ? 'لا يوجد روابط' : isDe ? 'Keine Links gefunden' : 'No Links Discovered',
    noLinksDescription: isAr ? 'لم يتم اكتشاف روابط في المستودع. يمكنك إضافة روابطك الخاصة هنا.' : isDe ? 'Im Repository wurden keine Links gefunden. Du kannst hier eigene Links ergänzen.' : 'No links discovered in the repository. You can add your own links here.',
    reviewBoundary: isAr ? 'مسودة قابلة للمراجعة والنسخ اليدوي — لا يوجد نشر تلقائي' : isDe ? 'Prüfbarer Entwurf zum manuellen Kopieren — keine automatische Veröffentlichung' : 'Reviewable draft for manual copying — no automatic publishing',
    newDraft: isAr ? 'إنشاء منشور جديد' : isDe ? 'Neuen Entwurf erstellen' : 'Generate New Post',
    noFiles: isAr ? 'لم يتم العثور على ملفات.' : isDe ? 'Keine Dateien gefunden.' : 'No files found.',
    about: isAr ? 'حول المستودع' : isDe ? 'Über das Repository' : 'About',
    noDescription: isAr ? 'لا يوجد وصف أو موقع أو مواضيع.' : isDe ? 'Keine Beschreibung, Website oder Themen angegeben.' : 'No description, website, or topics provided.',
    stars: isAr ? 'نجمة' : isDe ? 'Sterne' : 'stars',
    private: isAr ? 'خاص' : isDe ? 'Privat' : 'Private',
    public: isAr ? 'عام' : isDe ? 'Öffentlich' : 'Public',
    initialCommit: isAr ? 'الالتزام الأولي' : isDe ? 'Erster Commit' : 'Initial commit',
    commits: isAr ? 'التزامات' : isDe ? 'Commits' : 'commits',
    update: isAr ? 'تحديث' : isDe ? 'Aktualisieren' : 'Update',
    source: isAr ? 'المصدر' : isDe ? 'Quelle' : 'Source',
  };

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
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
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationNotice, setOperationNotice] = useState<string | null>(null);
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
  const [copyError, setCopyError] = useState('');
  const [commentCopyError, setCommentCopyError] = useState('');

  const [analyzingCommits, setAnalyzingCommits] = useState(false);
  const [commitAnalysis, setCommitAnalysis] = useState<any>(null);
  
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [savingCommitAnalysis, setSavingCommitAnalysis] = useState(false);

  const copyDraftText = async () => {
    if (!analysisResult?.post) return;
    setCopyError('');
    try {
      await navigator.clipboard.writeText(analysisResult.post);
      setHasCopied(true);
      window.setTimeout(() => setHasCopied(false), 2000);
    } catch {
      setHasCopied(false);
      setCopyError(ui.copyError);
    }
  };

  const copySuggestedComment = async () => {
    if (!analysisResult?.suggestedComment) return;
    setCommentCopyError('');
    try {
      await navigator.clipboard.writeText(analysisResult.suggestedComment);
      setHasCopiedComment(true);
      window.setTimeout(() => setHasCopiedComment(false), 2000);
    } catch {
      setHasCopiedComment(false);
      setCommentCopyError(ui.copyError);
    }
  };

  useEffect(() => {
    if (repoPhase === 'result' && analysisResult) {
      setTimeout(() => {
        const el = document.getElementById('analysis-result-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [repoPhase, analysisResult]);


  const saveToFirestore = async (type: 'repo_analysis' | 'commit_update', data: any, setSavingState: (s: boolean) => void) => {
    if (!user) {
      setOperationError(ui.login);
      return;
    }
    setOperationError(null);
    setOperationNotice(null);
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
      void recordAuthenticatedProductEvent(user, 'draft_saved', { mode: 'manual', characterCount: JSON.stringify(data).length });
      setOperationNotice(ui.saved);
    } catch (error) {
      console.error(error);
      setOperationError(ui.saveError);
    } finally {
      setSavingState(false);
    }
  };

  useEffect(() => {
    if (!owner || !repo) return;
    setLoadError(false);
    void recordAuthenticatedProductEvent(user, 'repo_selected', { source: demoMode || isBrowserE2E ? 'demo' : 'manual' });
    if (demoMode || isBrowserE2E) {
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

    if (!settings?.githubUsername) {
      setLoading(false);
      return;
    }

    const cacheKey = `${user?.uid || 'anonymous'}:${settings?.githubPermissions || 'public'}:${owner}/${repo}`.toLowerCase();
    const cached = repoDetailsCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < REPO_DETAILS_CACHE_TTL_MS) {
      setCommits(cached.commits);
      setBranches(cached.branches);
      setRepoFiles(cached.repoFiles);
      setRepoMeta(cached.repoMeta);
      setReadme(cached.readme);
      setSelectedBranch(cached.branches.find(b => b.name === 'main' || b.name === 'master')?.name || cached.branches[0]?.name || 'main');
      setLoading(false);
      return;
    }

    setLoading(true);
    const idTokenPromise = user?.getIdToken();
    void idTokenPromise.then(idToken => fetch(`/api/integrations/github/repository/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
      headers: { Authorization: `Bearer ${idToken || ''}` },
    })).then(async response => {
      if (!response.ok) throw new Error('Repository details unavailable');
      return response.json();
    }).then(({ commits: commitsData, branches: branchesData, contents: contentsData, repoMeta: metaData, readme: readmeData }) => {
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
      const decodedReadme = typeof readmeData?.content === 'string'
        ? atob(readmeData.content.replace(/\s/g, ''))
        : '';
      setReadme(decodedReadme);
      repoDetailsCache.set(cacheKey, {
        commits: Array.isArray(commitsData) ? commitsData : [],
        branches: Array.isArray(branchesData) ? branchesData : [],
        repoFiles: files,
        repoMeta: metaData,
        readme: decodedReadme,
        cachedAt: Date.now(),
      });
      setLoading(false);
    }).catch(() => {
      setCommits([]);
      setBranches([]);
      setRepoFiles([]);
      setRepoMeta(null);
      setReadme('');
      setLoadError(true);
      setLoading(false);
    });
  }, [owner, repo, settings, demoMode, retryNonce]);

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
              {repoMeta?.private ? ui.private : ui.public}
            </span>
          </div>

          {/* GitHub Tabs */}
          <div className="flex items-center gap-6 text-sm font-medium overflow-x-auto hide-scrollbar">
            {[
              { id: 'linkedin', icon: Zap, label: isAr ? 'مسودة موثقة' : isDe ? 'Evidenzentwurf' : 'Evidence Draft', highlight: true },
              { id: 'code', icon: FileCode2, label: isAr ? 'أدلة المستودع' : isDe ? 'Repository-Nachweise' : 'Repository Evidence' }
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
      ) : loadError ? (
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-xl rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center" role="alert">
            <RefreshCw className="mx-auto mb-4 h-10 w-10 text-amber-400" />
            <h2 className="mb-2 text-xl font-bold text-white">{isAr ? 'تعذر تحميل تفاصيل المستودع' : isDe ? 'Repository-Details konnten nicht geladen werden' : 'Repository details could not be loaded'}</h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-400">
              {isAr ? 'لم يتم إنشاء أي مسودة. تحقق من الاتصال أو صلاحية الوصول ثم حاول مرة أخرى.' : isDe ? 'Es wurde kein Entwurf erstellt. Prüfe Verbindung oder Zugriff und versuche es erneut.' : 'No draft was created. Check the connection or access scope, then try again.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setLoadError(false);
                setLoading(true);
                setRetryNonce(value => value + 1);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-500"
            >
              <RefreshCw className="h-4 w-4" />
              {isAr ? 'إعادة المحاولة' : isDe ? 'Erneut versuchen' : 'Retry'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            
            {activeTab === 'linkedin' ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6">
                {/* Left Panel: Configuration Workspace */}
                <div className="lg:col-span-8 space-y-10">
                  <div className="flex items-center gap-4 mb-2 border-b border-white/5 pb-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        {isAr ? 'إعدادات محرك الذكاء الاصطناعي' : isDe ? 'KI-Engine-Konfiguration' : 'AI Engine Configuration'}
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">
                        {isAr 
                          ? 'قم بتوجيه المحرك لإنشاء المحتوى الذي يعكس خبرتك بأفضل شكل.' 
                          : isDe ? 'Konfiguriere die Engine für einen Entwurf, der deine Expertise präzise widerspiegelt.' : 'Configure the engine to generate content that best reflects your expertise.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {isAr ? '1. زاوية النشر (Narrative Angle)' : isDe ? '1. Erzählwinkel' : '1. Narrative Angle'}
                    </label>
                    <IntentCards selectedIntent={intent} onSelectIntent={setIntent} lang={lang} />
                  </div>

                  <div className="space-y-4 pt-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {isAr ? '2. الجمهور المستهدف (Target Audience)' : isDe ? '2. Zielgruppe' : '2. Target Audience'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'Software Engineers', label: isAr ? 'المهندسون' : isDe ? 'Softwareentwickler' : 'Software Engineers' },
                        { id: 'CTOs/Tech Leads', label: isAr ? 'المدراء التقنيون' : isDe ? 'CTOs / Tech Leads' : 'CTOs/Tech Leads' },
                        { id: 'Recruiters/HR', label: isAr ? 'التوظيف / الموارد البشرية' : isDe ? 'Recruiting / HR' : 'Recruiters/HR' },
                        { id: 'General Public', label: isAr ? 'الجمهور العام' : isDe ? 'Allgemeine Öffentlichkeit' : 'General Public' }
                      ].map(audience => (
                        <button
                          key={audience.id}
                          onClick={() => setTargetAudience(audience.id)}
                          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 border ${
                            targetAudience === audience.id 
                              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' 
                              : 'bg-transparent text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                        >
                          {audience.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Generation Options */}
                <div className="lg:col-span-4">
                  <div className="sticky top-6">
                    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-800/50">
                      <Zap className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-bold text-slate-200">
                        {ui.generation}
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Deep Scan Card */}
                      <button 
                        onClick={async () => {
                          setOperationError(null);
                          setAnalyzing(true);
                          setRepoPhase('deep_scanning');
                          try {
                            const idToken = await user?.getIdToken();
                            const res = await fetch("/api/deep-scan", {
                              method: "POST",
                              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
                              body: JSON.stringify({ 
                                username: owner, 
                                repo: repo, 
                                lang: lang,
                                intent: intent,
                                targetAudience: targetAudience
                              })
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
                              setOperationError(getSafeRepoOperationError(lang, 'deep_scan', res.status));
                              setRepoPhase('idle');
                            }
                          } catch (err) {
                            console.error(err);
                            setOperationError(getSafeRepoOperationError(lang, 'deep_scan'));
                            setRepoPhase('idle');
                          } finally {
                            setAnalyzing(false);
                          }
                        }}
                        disabled={analyzing || repoPhase === 'generating' || repoPhase === 'deep_scanning'}
                        className="w-full text-left bg-gradient-to-br from-indigo-600/10 to-indigo-900/20 border border-indigo-500/30 hover:border-indigo-400 rounded-2xl p-5 transition-all shadow-[0_0_20px_rgba(79,70,229,0.05)] hover:shadow-[0_0_30px_rgba(79,70,229,0.15)] group disabled:opacity-50"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                            {analyzing && repoPhase === 'deep_scanning' ? <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" /> : <FolderGit2 className="w-5 h-5 text-indigo-400" />}
                          </div>
                          <div>
                            <h4 className="text-white font-bold mb-1 group-hover:text-indigo-300 transition-colors">{ui.deepScan}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">{ui.deepScanDescription}</p>
                          </div>
                        </div>
                      </button>

                      {/* Quick Analyze Card */}
                      <button 
                        onClick={async () => {
                          setOperationError(null);
                          setAnalyzing(true);
                          setRepoPhase('deep_scanning'); // Reuse loader
                          try {
                            const idToken = await user?.getIdToken();
                            
                            // Map commits to a simpler format
                            const commitSummary = commits.map(c => ({
                              sha: c.sha,
                              message: c.commit.message
                            }));
                            
                            const res = await fetch("/api/analyze-commits", {
                              method: "POST",
                              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
                              body: JSON.stringify({ repo, commits: commitSummary, lang })
                            });
                            const data = await res.json();
                            if(res.ok) {
                              setAnalysisResult({
                                post: `🚀 **${data.title}**\n\n${data.technicalUpdate}\n\n${data.changelog}`,
                                repository: { owner, name: repo }
                              });
                              setRepoPhase('result');
                            } else {
                              setOperationError(getSafeRepoOperationError(lang, 'commits', res.status));
                              setRepoPhase('idle');
                            }
                          } catch (err) {
                            console.error(err);
                            setOperationError(getSafeRepoOperationError(lang, 'commits'));
                            setRepoPhase('idle');
                          } finally {
                            setAnalyzing(false);
                          }
                        }}
                        disabled={analyzing || repoPhase === 'generating' || repoPhase === 'deep_scanning'}
                        className="w-full text-left bg-slate-900/60 border border-white/10 hover:border-slate-500 rounded-2xl p-5 transition-all hover:bg-slate-800/80 group disabled:opacity-50"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                            {analyzing && repoPhase !== 'deep_scanning' ? <RefreshCw className="w-5 h-5 animate-spin text-slate-400" /> : <GitCommit className="w-5 h-5 text-slate-400" />}
                          </div>
                          <div>
                            <h4 className="text-white font-bold mb-1 group-hover:text-slate-200 transition-colors">{ui.recentCommits}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">{ui.recentCommitsDescription}</p>
                          </div>
                        </div>
                      </button>
                      
                      {/* Custom Content Card */}
                      <button 
                        onClick={async () => {
                          setOperationError(null);
                          setAnalyzing(true);
                          try {
                            const idToken = await user?.getIdToken();
                            const res = await fetch("/api/analyze-repo", {
                              method: "POST",
                              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
                              body: JSON.stringify({ 
                                username: owner, 
                                repo: repo, 
                                projectDescription: projectDescription || '', 
                                intent: intent || 'project', 
                                humanContext: targetAudience || 'General Public', 
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
                              setOperationError(getSafeRepoOperationError(lang, 'analysis', res.status));
                            }
                          } catch (err) {
                            console.error(err);
                            setOperationError(getSafeRepoOperationError(lang, 'analysis'));
                          } finally {
                            setAnalyzing(false);
                          }
                        }}
                        disabled={analyzing || repoPhase === 'generating' || repoPhase === 'deep_scanning'}
                        className="w-full text-left bg-slate-900/60 border border-white/10 hover:border-slate-500 rounded-2xl p-5 transition-all hover:bg-slate-800/80 group disabled:opacity-50"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold mb-1 group-hover:text-slate-200 transition-colors">{ui.tutorial}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">{ui.tutorialDescription}</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status/Phases */}
                
                {operationError && (
                  <div className="mx-auto mb-6 flex max-w-3xl items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200" role="alert" aria-live="assertive">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" aria-hidden="true" />
                    <div className="flex-1 leading-relaxed">{operationError}</div>
                    <button
                      type="button"
                      onClick={() => setOperationError(null)}
                      className="rounded-lg px-2 py-1 text-xs font-bold text-rose-200 underline-offset-2 hover:bg-rose-500/20 hover:underline focus:outline-none focus:ring-2 focus:ring-rose-300"
                    >
                      {isAr ? 'إخفاء' : isDe ? 'Ausblenden' : 'Dismiss'}
                    </button>
                  </div>
                )}

                {operationNotice && (
                  <div className="mx-auto mb-6 flex max-w-3xl items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200" role="status" aria-live="polite">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                    <span className="flex-1">{operationNotice}</span>
                    <button type="button" onClick={() => setOperationNotice(null)} className="text-xs font-bold underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-300">
                      {isAr ? 'إخفاء' : isDe ? 'Ausblenden' : 'Dismiss'}
                    </button>
                  </div>
                )}

                {needsContext && repoPhase === 'idle' && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl slide-down max-w-2xl mx-auto">
                    <p className="font-bold text-amber-400 text-sm mb-2">{ui.moreContext}</p>
                    <p className="text-amber-200/80 text-sm mb-4">{ui.contextDescription}</p>
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
                    <h3 className="text-lg font-bold text-slate-200 mb-6">{ui.chooseAngle}</h3>
                    <div className="space-y-3">
                      {angles.map((angle) => (
                        <button
                          key={angle.id}
                          onClick={() => {
                            setSelectedAngleId(angle.id);
                            void recordAuthenticatedProductEvent(user, 'meaningful_angle_selected', { language: lang, mode: 'manual' });
                          }}
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
                        setOperationError(null);
                        setRepoPhase('generating');
                        try {
                          const idToken = await user?.getIdToken();
                          const res = await fetch("/api/generate-post", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
                          body: JSON.stringify({ username: owner, repo: repo, projectDescription, analysisToken, angleId: angle.id, humanContext, lang })
                          });
                          
                          const data = await res.json();
                          if(res.ok) {
                            setAnalysisResult(data);
                            setRepoPhase('result');
                          } else {
                            setOperationError(getSafeRepoOperationError(lang, 'generation', res.status));
                            setRepoPhase('angles');
                          }
                        } catch (err) {
                          console.error(err);
                          setOperationError(getSafeRepoOperationError(lang, 'generation'));
                          setRepoPhase('angles');
                        }
                      }}
                      disabled={!selectedAngleId || !analysisToken || (angles.find(a => a.id === selectedAngleId)?.requiresHumanContext && !humanContext)}
                      className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      {ui.generate}
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
                      label={ui.drafting}
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
                    id="analysis-result-section"
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
                                <span className="text-slate-500 block text-xs">{ui.intent}</span>
                              <span className="text-indigo-300 font-medium">{angles.find(a => a.id === selectedAngleId)?.title || intent}</span>
                            </div>
                          </div>
                          
                          {analysisResult.evidence && analysisResult.evidence.length > 0 && (
                            <div className="flex items-start gap-2 text-sm pt-2">
                              <Zap size={16} className="text-slate-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-slate-500 block text-xs mb-1">{ui.evidence}</span>
                                <ul className="text-emerald-400 space-y-2">
                                  {analysisResult.evidence.map((ev: any, idx: number) => (
                                    <li key={idx} className="flex gap-1.5 items-start">
                                      <span className="opacity-50 mt-1">•</span>
                                      <span className="leading-snug text-[13px]">
                                        {typeof ev === 'string' ? ev : ev.fact}
                                        {ev.source && <span className="block mt-0.5 text-[10px] font-mono text-emerald-400/50 uppercase tracking-wider">{ui.source}: {ev.source}</span>}
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
                        <p className="leading-relaxed">{ui.aiNotice}</p>
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
                        {savingAnalysis ? ui.saving : ui.saveLibrary}
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
                        {/* LinkedIn-targeted draft preview without fabricated identity, timestamp, or publish state. */}
                        <div className="p-4 md:p-5 pb-2">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                                <LinkedinIcon size={22} className="text-white" aria-hidden="true" />
                              </div>
                              <div>
                                <h4 className="text-[15px] font-bold text-slate-900 leading-tight">{isAr ? 'مسودة منشور LinkedIn' : isDe ? 'LinkedIn-Entwurf' : 'LinkedIn draft'}</h4>
                                <p className="text-[12px] text-slate-500 mt-0.5">{ui.audienceLabel(targetAudience)}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-1">
                              {isAr ? 'للمراجعة والنسخ' : isDe ? 'Prüfen und kopieren' : 'Review and copy'}
                            </span>
                          </div>
                          
                          <div className="relative group/post">
                            <textarea
                              aria-label={ui.draftPostLabel}
                              value={analysisResult.post}
                              onChange={(e) => setAnalysisResult({ ...analysisResult, post: e.target.value })}
                              className="w-full min-h-[250px] bg-transparent text-[14px] leading-relaxed text-slate-800 mb-2 whitespace-pre-wrap resize-y focus:outline-none border-2 border-transparent focus:border-indigo-100 p-2 rounded-lg transition-colors hover:bg-slate-50"
                            />
                            <div className={`absolute top-2 ${lang === 'ar' ? 'left-2' : 'right-2'} opacity-0 group-hover/post:opacity-100 transition-opacity`}>
                                <button
                                  type="button"
                                  onClick={copyDraftText}
                                  className="p-2 bg-slate-800 text-white rounded-md shadow-md hover:bg-slate-700 flex items-center gap-1.5 text-xs font-bold"
                                >
                                  {hasCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                  {hasCopied ? ui.copied : ui.copy}
                                </button>
                            </div>
                            {copyError && <p role="alert" className="mt-2 text-xs text-red-600">{copyError}</p>}
                          </div>
                        </div>

                        {/* Optional verified-link note */}
                        {analysisResult.suggestedComment ? (
                          <div className="px-4 md:px-5 pb-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative group/comment">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600" aria-hidden="true">
                                  <Link2 size={12} />
                                </div>
                                <span className="text-xs font-bold text-slate-700">{ui.linkNote}</span>
                              </div>
                              <textarea
                                aria-label={ui.suggestedCommentLabel}
                                value={analysisResult.suggestedComment}
                                onChange={(e) => setAnalysisResult({ ...analysisResult, suggestedComment: e.target.value })}
                                className="w-full min-h-[80px] bg-transparent text-[13px] leading-relaxed text-slate-600 mb-1 whitespace-pre-wrap resize-y focus:outline-none border-2 border-transparent focus:border-indigo-100 p-2 rounded-lg transition-colors hover:bg-slate-100"
                              />
                              <button
                                type="button"
                                onClick={copySuggestedComment}
                                className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover/comment:opacity-100`}
                                title={isAr ? 'نسخ ملاحظة الروابط' : isDe ? 'Link-Hinweis kopieren' : 'Copy link note'}
                              >
                                {hasCopiedComment ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                              </button>
                              {commentCopyError && <p role="alert" className="mt-2 text-xs text-red-600">{commentCopyError}</p>}
                            </div>
                          </div>
                        ) : (
                          <div className="px-4 md:px-5 pb-4">
                            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 border-dashed relative">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-500">{ui.noLinks}</span>
                              </div>
                              <p className="text-[12px] text-slate-400">{ui.noLinksDescription}</p>
                            </div>
                          </div>
                        )}

                        <div className="px-4 md:px-5 py-3 border-t border-slate-100 flex items-center gap-2 text-slate-500" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          <FileCheck2 size={16} className="text-emerald-600" />
                          <span className="text-xs font-semibold">
                            {ui.reviewBoundary}
                          </span>
                        </div>
                        
                        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          <button
                            onClick={() => { setRepoPhase('idle'); }}
                            className="text-xs text-slate-500 hover:text-indigo-600 font-bold transition-colors flex items-center gap-1.5"
                          >
                            <RefreshCw size={14} />
                            {ui.newDraft}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              // -----------------------------------------------------------
              // Repository evidence view
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
                          {commits[0]?.commit.message || ui.initialCommit}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{commits[0] ? new Date(commits[0].commit.author.date).toLocaleDateString() : ''}</span>
                        <strong className="text-slate-300">{commits.length}</strong> {ui.commits}
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
                          <span className="ml-auto text-xs text-slate-600">{ui.update} {file.name}</span>
                        </div>
                      ))}
                      {repoFiles.length === 0 && (
                        <div className="p-4 text-sm text-slate-500 text-center">{ui.noFiles}</div>
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
                    <h3 className="text-slate-200 font-semibold mb-3">{ui.about}</h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                      {repoMeta?.description || ui.noDescription}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Star className="w-4 h-4 text-slate-500" />
                        <strong className="text-slate-300">{repoMeta?.stargazers_count || 0}</strong> {ui.stars}
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

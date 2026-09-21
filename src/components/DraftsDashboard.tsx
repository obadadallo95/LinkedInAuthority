import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../application/AuthContext';
import { firestoreService, DraftData, DraftConflictError } from '../services/firestoreService';
import { FileText, Save, Copy, Trash2, Edit3, X, Check, ShieldAlert, ChevronDown, History, Download, Eye, EyeOff } from 'lucide-react';
import { recordAuthenticatedProductEvent } from '../utils/productTelemetry';
import { isBrowserE2E } from '../utils/e2e';
import { mergeDraftVersions } from '../utils/draftMerge';

const getEditableDraftText = (content: string) => {
  try {
    const parsed = JSON.parse(content);
    return parsed.post || parsed.potentialContent || parsed.changelog || content;
  } catch {
    return content;
  }
};

type DraftConflictState = {
  draftId: string;
  baseContent: string;
  localContent: string;
  serverContent: string;
  serverRevision?: number;
  serverAvailable: boolean;
};

export const DraftsDashboard = ({ lang }: { lang: 'ar' | 'en' | 'de' }) => {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<(DraftData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [editingRevision, setEditingRevision] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [previewDraftId, setPreviewDraftId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [versionsByDraft, setVersionsByDraft] = useState<Record<string, Array<{ id: string; revision?: number; content?: string; savedAt?: any; source?: 'original' | 'manual' }>>>({});
  const [loadingVersionsId, setLoadingVersionsId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<DraftConflictState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const editingRevisionRef = useRef<number | undefined>(undefined);
  const editContentRef = useRef('');
  const lastSavedContentRef = useRef('');
  const savingRef = useRef(false);
  const conflictDraftIdRef = useRef<string | null>(null);
  const persistDraftRef = useRef<(draftId: string, closeEditor: boolean) => Promise<void> | undefined>(undefined);

  const isAr = lang === 'ar';
  const isDe = lang === 'de';

  useEffect(() => {
    const fetchDrafts = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setLoadError(false);
        const data = await firestoreService.getUserDrafts(user.uid);
        // Sort by newest first
        setDrafts(data.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis()) as any);
      } catch (error) {
        console.error("Error fetching drafts:", error);
        setDrafts([]);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, [user, retryNonce]);

  const handleEdit = (draft: DraftData & { id: string }) => {
    const initialContent = getEditableDraftText(draft.content);
    setEditingId(draft.id);
    conflictDraftIdRef.current = null;
    setConflict(null);
    setPreviewDraftId(null);
    const revision = Number(draft.revision || 1);
    editingRevisionRef.current = revision;
    editContentRef.current = initialContent;
    lastSavedContentRef.current = initialContent;
    setEditingRevision(revision);
    setEditContent(initialContent);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setEditingRevision(undefined);
    editingRevisionRef.current = undefined;
    editContentRef.current = '';
    lastSavedContentRef.current = '';
    conflictDraftIdRef.current = null;
    setConflict(null);
    setPreviewDraftId(null);
  };

  const persistDraft = async (draftId: string, closeEditor: boolean) => {
    if (!user || savingRef.current) return;
    setActionError(null);
    const contentToSave = editContentRef.current;
    if (!closeEditor && contentToSave === lastSavedContentRef.current) return;
    savingRef.current = true;
    if (closeEditor) setSaving(true);
    else setAutoSaving(true);
    try {
      // Find original draft to keep its structure if it was JSON
      const originalDraft = drafts.find(d => d.id === draftId);
      let newContentStr = contentToSave;
      
      if (originalDraft) {
        try {
            const parsed = JSON.parse(originalDraft.content);
            if (parsed.post) {
                parsed.post = contentToSave;
            } else if (parsed.potentialContent) {
                parsed.potentialContent = contentToSave;
            } else if (parsed.changelog) {
                parsed.changelog = contentToSave;
            }
            if (parsed.claimAudit) {
                const previousAudit = parsed.claimAudit;
                const staleWarning = isAr
                  ? 'تم تعديل النص بعد آخر تدقيق للأدلة. راجع الادعاءات قبل النسخ.'
                  : isDe
                    ? 'Dieser Entwurf wurde nach der letzten Evidenzprüfung bearbeitet. Prüfe die Aussagen vor dem Kopieren.'
                    : 'This draft was edited after its last evidence audit. Review claims before copying.';
                parsed.claimAudit = {
                  ...previousAudit,
                  passed: false,
                  stale: true,
                  warnings: (previousAudit.warnings || []).includes(staleWarning)
                    ? previousAudit.warnings
                    : [...(previousAudit.warnings || []), staleWarning],
                };
            }
            newContentStr = JSON.stringify(parsed);
        } catch {
            // It wasn't JSON, just save raw text
        }
      }

      const result = await firestoreService.updateDraft(user.uid, draftId, { content: newContentStr }, editingRevisionRef.current);
      const revision = result?.revision || (editingRevisionRef.current || 1) + 1;
      setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, content: newContentStr, revision } : d));
      editingRevisionRef.current = revision;
      lastSavedContentRef.current = contentToSave;
      setEditingRevision(revision);
      void recordAuthenticatedProductEvent(user, 'draft_saved', { characterCount: contentToSave.length, mode: closeEditor ? 'manual' : 'autosave' });
      if (closeEditor) {
        void recordAuthenticatedProductEvent(user, 'draft_edited', { characterCount: contentToSave.length, mode: 'manual' });
        setEditingId(null);
        setEditingRevision(undefined);
        editingRevisionRef.current = undefined;
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      if (error instanceof DraftConflictError) {
        conflictDraftIdRef.current = draftId;
        let serverContent = '';
        let serverRevision = error.currentRevision;
        let serverAvailable = false;
        try {
          const latestDrafts = await firestoreService.getUserDrafts(user.uid);
          const latestDraft = latestDrafts.find((draft: DraftData & { id: string }) => draft.id === draftId);
          if (latestDraft) {
            serverContent = getEditableDraftText(latestDraft.content);
            serverRevision = Number(latestDraft.revision || serverRevision || 1);
            serverAvailable = true;
            setDrafts(prev => prev.map(draft => draft.id === draftId ? { ...draft, ...latestDraft } : draft));
          }
        } catch (refreshError) {
          console.error('Error loading the latest draft after a conflict:', refreshError);
        }
        setConflict({ draftId, baseContent: lastSavedContentRef.current, localContent: contentToSave, serverContent, serverRevision, serverAvailable });
      } else {
        setActionError(isAr ? 'فشل الحفظ. حاول مرة أخرى.' : isDe ? 'Speichern fehlgeschlagen. Bitte erneut versuchen.' : 'Save failed. Please try again.');
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
      setAutoSaving(false);
      if (!closeEditor && editingId === draftId && !conflictDraftIdRef.current && editContentRef.current !== lastSavedContentRef.current) {
        window.setTimeout(() => {
          void persistDraftRef.current?.(draftId, false);
        }, 0);
      }
    }
  };

  persistDraftRef.current = persistDraft;
  editContentRef.current = editContent;

  useEffect(() => {
    if (!editingId || editContent === lastSavedContentRef.current) return;
    const draftId = editingId;
    const timer = window.setTimeout(() => {
      void persistDraftRef.current?.(draftId, false);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [editingId, editContent]);

  const handleSave = async (draftId: string) => {
    await persistDraft(draftId, true);
  };

  const resolveConflict = (choice: 'local' | 'server' | 'merge' | 'dismiss') => {
    if (!conflict) return;
    if (choice === 'dismiss') {
      conflictDraftIdRef.current = null;
      setConflict(null);
      return;
    }
    const nextContent = choice === 'local'
      ? conflict.localContent
      : choice === 'server'
        ? conflict.serverContent
        : mergeDraftVersions(conflict.baseContent, conflict.localContent, conflict.serverContent).content;
    editContentRef.current = nextContent;
    setEditContent(nextContent);
    editingRevisionRef.current = conflict.serverRevision;
    setEditingRevision(conflict.serverRevision);
    lastSavedContentRef.current = conflict.serverContent;
    conflictDraftIdRef.current = null;
    setConflict(null);
  };

  const handleExport = (draft: DraftData & { id: string }) => {
    const text = editingId === draft.id ? editContentRef.current : getDisplayText(draft.content);
    const safeTitle = (draft.title || 'linkedin-authority-draft').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'linkedin-authority-draft';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeTitle}.txt`;
    link.click();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  };

  const handleDelete = async (draftId: string) => {
    if (!user) return;
    setActionError(null);
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذه المسودة؟' : isDe ? 'Möchtest du diesen Entwurf wirklich löschen?' : 'Are you sure you want to delete this draft?')) return;
    try {
      if (isBrowserE2E) {
        await firestoreService.deleteDraft(user.uid, draftId);
      } else {
        const idToken = await user.getIdToken();
        const response = await fetch(`/api/account/drafts/${encodeURIComponent(draftId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!response.ok) throw new Error('Draft deletion endpoint failed');
      }
      setDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (error) {
      console.error("Error deleting draft:", error);
      setActionError(isAr ? 'تعذر حذف المسودة حالياً.' : isDe ? 'Der Entwurf konnte nicht gelöscht werden.' : 'The draft could not be deleted.');
    }
  };

  const handleCopy = async (content: string, id: string) => {
    let audit: DraftAudit | undefined;
    let textToCopy = content;
    try {
        const parsed = JSON.parse(content);
        audit = parsed.claimAudit;
        const needsReview = audit?.stale || audit?.claims?.some(claim => claim.status !== 'supported');
        if (needsReview) {
          const message = isAr
            ? 'تحتوي هذه المسودة على ادعاءات تحتاج مراجعة أو تدقيقاً جديداً. هل تريد النسخ بعد تأكيد مراجعتك البشرية؟'
            : isDe
              ? 'Dieser Entwurf enthält Aussagen, die geprüft oder erneut mit Nachweisen abgeglichen werden müssen. Kopiere ihn erst nach deiner menschlichen Prüfung.'
              : 'This draft contains claims that need review or a fresh evidence audit. Copy only after confirming your human review.';
          if (!window.confirm(message)) return;
        }
        textToCopy = parsed.post || parsed.potentialContent || parsed.changelog || content;
        if (parsed.suggestedComment) {
            textToCopy += `\n\n--- Optional Link Note ---\n${parsed.suggestedComment}`;
        }
    } catch {
        // Plain-text drafts remain copyable even when stored content is not JSON.
    }
    try {
        await navigator.clipboard.writeText(textToCopy);
    } catch (error) {
        console.error('Draft copy failed:', error);
        setActionError(copy.copyFailed);
        return;
    }
    
    setCopiedId(id);
    void recordAuthenticatedProductEvent(user, 'draft_copied', { characterCount: content.length, mode: 'manual' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLoadVersions = async (draftId: string) => {
    if (!user) return;
    if (versionsByDraft[draftId]) {
      setVersionsByDraft(prev => { const next = { ...prev }; delete next[draftId]; return next; });
      return;
    }
    setLoadingVersionsId(draftId);
    try {
      const versions = await firestoreService.getDraftVersions(user.uid, draftId);
      setVersionsByDraft(prev => ({ ...prev, [draftId]: versions as any }));
    } catch (error) {
      console.error('Error loading draft versions:', error);
      setActionError(isAr ? 'تعذر تحميل سجل النسخ. حاول مرة أخرى.' : isDe ? 'Der Entwurfsverlauf konnte nicht geladen werden. Bitte erneut versuchen.' : 'Draft history could not be loaded. Please try again.');
    } finally {
      setLoadingVersionsId(null);
    }
  };

  const getDisplayText = (content: string) => {
      try {
          const parsed = JSON.parse(content);
          let text = getEditableDraftText(content);
          if (parsed.suggestedComment) {
            text += `\n\n--- Optional Link Note ---\n${parsed.suggestedComment}`;
          }
          return text;
      } catch {
          return content;
      }
  };

  type DraftAudit = { passed?: boolean; stale?: boolean; warnings?: string[]; claims?: Array<{ claim: string; status: string; confidence?: number; supportingEvidence: string[]; reason?: string }> };
  type DraftEvidence = { id: string; sourceType?: string; reference?: string; excerpt?: string };

  const getClaimAudit = (content: string): DraftAudit | undefined => {
    try {
      return JSON.parse(content).claimAudit;
    } catch {
      return undefined;
    }
  };

  const getEvidence = (content: string): DraftEvidence[] => {
    try {
      const parsed = JSON.parse(content);
      return parsed.synthesizedContext?.evidence || parsed.evidence || [];
    } catch {
      return [];
    }
  };

  const getQualityEvaluation = (content: string): { passed?: boolean; score?: number; warnings?: string[]; hardFailures?: string[] } | undefined => {
    try {
      return JSON.parse(content).qualityEvaluation;
    } catch {
      return undefined;
    }
  };

  const copy = {
    login: isAr ? 'الرجاء تسجيل الدخول لعرض المسودات' : isDe ? 'Bitte melden Sie sich an, um Entwürfe zu sehen.' : 'Please log in to view drafts',
    title: isAr ? 'المسودات والمحتوى' : isDe ? 'Entwürfe & Inhalte' : 'Drafts & Content',
    description: isAr
      ? 'هنا تجد التحليلات والمسودات التي أنشأتها. راجع الأدلة والادعاءات، عدّل المحتوى، ثم انسخه يدوياً إلى LinkedIn.'
      : isDe
        ? 'Prüfen Sie Nachweise und Aussagen, bearbeiten Sie den Entwurf und kopieren Sie ihn anschließend manuell zu LinkedIn. Das Produkt veröffentlicht nicht für Sie.'
        : 'Review the evidence and claims, edit the draft, then copy it manually to LinkedIn. The product never publishes for you.',
    emptyTitle: isAr ? 'لا يوجد مسودات حتى الآن' : isDe ? 'Noch keine Entwürfe' : 'No drafts yet',
    emptyDescription: isAr ? 'قم باختيار مستودع من قائمة المشاريع واضغط على "تحليل" لتوليد مسوداتك الأولى.' : isDe ? 'Wählen Sie ein Repository und starten Sie eine Analyse, um Ihren ersten Entwurf zu erstellen.' : 'Select a repository and click Analyze to generate your first drafts.',
    copy: isAr ? 'نسخ' : isDe ? 'Kopieren' : 'Copy',
    copied: isAr ? 'تم النسخ' : isDe ? 'Kopiert' : 'Copied',
    copyFailed: isAr ? 'تعذر النسخ إلى الحافظة. انسخ النص يدوياً من المعاينة.' : isDe ? 'Der Text konnte nicht kopiert werden. Kopiere ihn bitte manuell aus der Vorschau.' : 'Copy failed. Please copy the text manually from the preview.',
    history: isAr ? 'سجل النسخ' : isDe ? 'Verlauf' : 'History',
    hideHistory: isAr ? 'إخفاء السجل' : isDe ? 'Verlauf ausblenden' : 'Hide history',
    loadingHistory: isAr ? 'جاري التحميل' : isDe ? 'Wird geladen' : 'Loading',
    edit: isAr ? 'تعديل' : isDe ? 'Bearbeiten' : 'Edit',
    delete: isAr ? 'حذف' : isDe ? 'Löschen' : 'Delete',
    save: isAr ? 'حفظ' : isDe ? 'Speichern' : 'Save',
    autoSaving: isAr ? 'حفظ تلقائي...' : isDe ? 'Automatisch gespeichert …' : 'Autosaving…',
    cancel: isAr ? 'إلغاء' : isDe ? 'Abbrechen' : 'Cancel',
    export: isAr ? 'تصدير' : isDe ? 'Exportieren' : 'Export',
    preview: isAr ? 'معاينة نظيفة' : isDe ? 'Saubere Vorschau' : 'Clean preview',
    hidePreview: isAr ? 'إخفاء المعاينة' : isDe ? 'Vorschau ausblenden' : 'Hide preview',
    characters: isAr ? 'حرف' : isDe ? 'Zeichen' : 'characters',
    loadErrorTitle: isAr ? 'تعذر تحميل المسودات' : isDe ? 'Entwürfe konnten nicht geladen werden' : 'Drafts could not be loaded',
    loadErrorDescription: isAr ? 'لم يتم فقدان المسودات. تحقق من الاتصال ثم حاول مرة أخرى.' : isDe ? 'Deine Entwürfe wurden nicht gelöscht. Prüfe die Verbindung und versuche es erneut.' : 'Your drafts were not deleted. Check the connection and try again.',
    retry: isAr ? 'إعادة المحاولة' : isDe ? 'Erneut versuchen' : 'Retry',
    originalAi: isAr ? 'النسخة الأصلية المولّدة' : isDe ? 'Originale KI-Version' : 'Original AI version',
    revision: isAr ? 'النسخة' : isDe ? 'Revision' : 'Revision',
    conflictTitle: isAr ? 'تعارض في نسخة المسودة' : isDe ? 'Versionskonflikt im Entwurf' : 'Draft version conflict',
    conflictDescription: isAr
      ? 'تم حفظ نسخة أحدث من هذه المسودة في مكان آخر. قارن النسختين واختر ما تريد الاحتفاظ به.'
      : isDe
        ? 'Eine neuere Version wurde an anderer Stelle gespeichert. Vergleiche beide Versionen und entscheide, was erhalten bleiben soll.'
        : 'A newer version was saved elsewhere. Compare both versions and choose what to keep.',
    localVersion: isAr ? 'تعديلاتك الحالية' : isDe ? 'Deine aktuellen Änderungen' : 'Your current edits',
    serverVersion: isAr ? 'آخر نسخة محفوظة' : isDe ? 'Zuletzt gespeicherte Version' : 'Latest saved version',
    latestUnavailable: isAr ? 'تعذر تحميل النسخة الأحدث. يمكنك الاحتفاظ بتعديلاتك والمحاولة مرة أخرى.' : isDe ? 'Die neueste Version konnte nicht geladen werden. Du kannst deine Änderungen behalten und es erneut versuchen.' : 'The latest version could not be loaded. You can keep your edits and try again.',
    keepLocal: isAr ? 'الاحتفاظ بتعديلاتي' : isDe ? 'Meine Änderungen behalten' : 'Keep my edits',
    useLatest: isAr ? 'استخدام النسخة الأحدث' : isDe ? 'Neueste Version verwenden' : 'Use latest version',
    mergeVersions: isAr ? 'دمج التعديلات' : isDe ? 'Änderungen zusammenführen' : 'Merge non-conflicting edits',
    mergeHint: isAr ? 'سيُظهر الدمج التعارضات بعلامات واضحة لتراجعها قبل الحفظ.' : isDe ? 'Konflikte werden mit Markierungen angezeigt und müssen vor dem Speichern geprüft werden.' : 'Conflicts will be shown with markers for review before saving.',
    dismissConflict: isAr ? 'لاحقاً' : isDe ? 'Später' : 'Decide later',
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        {copy.login}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`flex-1 flex items-center justify-center p-6 ${isAr ? 'font-arabic' : 'font-sans'}`} dir={isAr ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-xl rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center" role="alert">
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-amber-400" />
          <h1 className="mb-2 text-xl font-bold text-white">{copy.loadErrorTitle}</h1>
          <p className="mb-6 text-sm leading-relaxed text-slate-400">{copy.loadErrorDescription}</p>
          <button
            type="button"
            onClick={() => {
              setLoadError(false);
              setLoading(true);
              setRetryNonce(value => value + 1);
            }}
            className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-500"
          >
            {copy.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto w-full p-4 ${isAr ? 'font-arabic' : 'font-sans'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="text-3xl font-bold text-white mb-2">{copy.title}</h1>
      <p className="text-slate-400 mb-8">
        {copy.description}
      </p>

      {actionError && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert" aria-live="assertive">
          <span className="flex-1">{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="text-xs font-bold underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-rose-300">
            {isAr ? 'إخفاء' : isDe ? 'Ausblenden' : 'Dismiss'}
          </button>
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center">
            <FileText size={48} className="text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-2">{copy.emptyTitle}</h3>
            <p className="text-sm text-slate-500 max-w-md">
                {copy.emptyDescription}
            </p>
        </div>
      ) : (
        <div className="space-y-6">
          {drafts.map(draft => (
            <div key={draft.id} className="bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-white/20">
              <div className="bg-slate-800/50 p-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <FileText size={16} className="text-indigo-400" />
                    {draft.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">{draft.projectId}</span>
                    <span>{draft.type === 'repo_analysis' ? 'تحليل مستودع' : 'تحديث برمجي'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {editingId !== draft.id ? (
                      <>
                        <button 
                          onClick={() => handleCopy(draft.content, draft.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          {copiedId === draft.id ? <Check size={14} className="text-emerald-400"/> : <Copy size={14} />}
                          {copiedId === draft.id ? copy.copied : copy.copy}
                        </button>
                        <button
                          onClick={() => setPreviewDraftId(previewDraftId === draft.id ? null : draft.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                          aria-pressed={previewDraftId === draft.id}
                        >
                          {previewDraftId === draft.id ? <EyeOff size={14} /> : <Eye size={14} />}
                          {previewDraftId === draft.id ? copy.hidePreview : copy.preview}
                        </button>
                        <button
                          onClick={() => handleExport(draft)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Download size={14} />
                          {copy.export}
                        </button>
                        <button
                          onClick={() => handleLoadVersions(draft.id)}
                          disabled={loadingVersionsId === draft.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          <History size={14} />
                          {loadingVersionsId === draft.id ? copy.loadingHistory : versionsByDraft[draft.id] ? copy.hideHistory : copy.history}
                        </button>
                        <button 
                          onClick={() => handleEdit(draft)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Edit3 size={14} />
                          {copy.edit}
                        </button>
                        <button 
                          onClick={() => handleDelete(draft.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors ml-2"
                          title={copy.delete}
                          aria-label={copy.delete}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                  ) : (
                      <>
                        <button 
                          onClick={() => handleSave(draft.id)}
                          disabled={saving || autoSaving}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          <Save size={14} />
                            {saving ? (isAr ? 'جاري الحفظ' : isDe ? 'Wird gespeichert' : 'Saving') : copy.save}
                        </button>
                        {autoSaving && (
                          <span className="text-[11px] text-indigo-300" role="status" aria-live="polite">
                            {copy.autoSaving}
                          </span>
                        )}
                        <button
                          onClick={() => setPreviewDraftId(previewDraftId === draft.id ? null : draft.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                          aria-pressed={previewDraftId === draft.id}
                        >
                          {previewDraftId === draft.id ? <EyeOff size={14} /> : <Eye size={14} />}
                          {previewDraftId === draft.id ? copy.hidePreview : copy.preview}
                        </button>
                        <button
                          onClick={() => handleExport(draft)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Download size={14} />
                          {copy.export}
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          <X size={14} />
                          {copy.cancel}
                        </button>
                      </>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                {versionsByDraft[draft.id] && (
                  <div className="mb-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs" aria-label={isAr ? 'سجل نسخ المسودة' : 'Draft version history'}>
                    <div className="mb-2 flex items-center gap-2 font-bold text-indigo-200"><History size={14} />{isAr ? 'النسخ المحفوظة' : isDe ? 'Gespeicherte Versionen' : 'Saved versions'}</div>
                    {versionsByDraft[draft.id].length === 0 ? (
                      <p className="text-slate-400">{isAr ? 'لا توجد نسخ يدوية محفوظة بعد.' : isDe ? 'Noch keine manuellen Versionen gespeichert.' : 'No manual saved versions yet.'}</p>
                    ) : (
                      <div className="space-y-2">
                        {versionsByDraft[draft.id].map(version => (
                          <details key={version.id} className="rounded-lg border border-white/5 bg-slate-950/70 p-2">
                            <summary className="cursor-pointer text-slate-300">{version.source === 'original' ? copy.originalAi : `${copy.revision} ${version.revision || version.id}`}</summary>
                            <p className="mt-2 whitespace-pre-wrap text-slate-400">{(() => { try { const parsed = JSON.parse(version.content || ''); return parsed.post || parsed.potentialContent || parsed.changelog || version.content; } catch { return version.content; } })()}</p>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {(() => {
                  const audit = getClaimAudit(draft.content);
                  const quality = getQualityEvaluation(draft.content);
                  const evidence = getEvidence(draft.content);
                  const staleWarning = isAr
                    ? 'تم تعديل النص بعد آخر تدقيق للأدلة. راجع الادعاءات قبل النسخ.'
                    : 'This draft was edited after its last evidence audit. Review claims before copying.';
                  const warnings = [
                    ...(audit?.stale && !(audit.warnings || []).includes(staleWarning) ? [staleWarning] : []),
                    ...(audit?.warnings || []),
                    ...(quality?.hardFailures || []),
                    ...(quality?.warnings || []),
                  ];
                  if (warnings.length === 0 && !audit?.claims?.length) return null;
                  return (
                    <div className="mb-4 space-y-3 text-xs" role="status">
                      {warnings.length > 0 && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-amber-200">
                          <div className="flex items-center gap-2 font-bold"><ShieldAlert size={14} />
                            {isAr ? 'تحذيرات جودة وأدلة المحتوى' : isDe ? 'Evidenz- und Qualitätshinweise' : 'Evidence and quality warnings'}
                          </div>
                          <p className="mt-1 text-amber-200/70">
                            {isAr ? 'راجع الادعاءات التالية قبل النسخ أو المشاركة اليدوية:' : isDe ? 'Prüfe diese Aussagen vor dem Kopieren oder manuellen Teilen:' : 'Review these claims before copying or manual sharing:'}
                          </p>
                          <ul className="mt-2 list-disc space-y-1 ps-4 text-amber-100/80">
                            {warnings.slice(0, 5).map((warning, index) => <li key={`${draft.id}-warning-${index}`}>{warning}</li>)}
                          </ul>
                        </div>
                      )}
                      {audit?.claims?.length ? (
                        <details className="group rounded-xl border border-white/10 bg-slate-950/70">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 text-slate-200">
                            <span className="flex items-center gap-2 font-bold"><ShieldAlert size={14} className="text-indigo-300" />
                              {isAr ? 'مراجعة الادعاءات والأدلة' : isDe ? 'Aussagen und Nachweise prüfen' : 'Claims and evidence review'}
                            </span>
                            <ChevronDown size={14} className="text-slate-500 transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="space-y-3 border-t border-white/5 p-3">
                            {audit.claims.map((claim, index) => {
                              const claimEvidence = evidence.filter(item => claim.supportingEvidence?.includes(item.id));
                              const statusClass = claim.status === 'supported' ? 'text-emerald-300' : claim.status === 'needs_review' ? 'text-amber-300' : 'text-red-300';
                              return (
                                <div key={`${draft.id}-claim-${index}`} className="rounded-lg border border-white/5 bg-slate-900/70 p-3">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <p className="text-slate-200">{claim.claim}</p>
                                    <span className={`shrink-0 font-bold ${statusClass}`}>
                                      {claim.status === 'supported' ? (isAr ? 'مدعوم' : 'Supported') : claim.status === 'needs_review' ? (isAr ? 'يحتاج مراجعة' : 'Needs review') : (isAr ? 'غير مدعوم' : 'Unsupported')}
                                      {typeof claim.confidence === 'number' ? ` · ${Math.round(claim.confidence * 100)}%` : ''}
                                    </span>
                                  </div>
                                  {claim.reason && <p className="mt-2 text-slate-400">{claim.reason}</p>}
                                  {claimEvidence.length > 0 ? (
                                    <div className="mt-2 space-y-2 text-slate-400">
                                      {claimEvidence.slice(0, 2).map(item => (
                                        <div key={item.id} className="rounded border border-white/5 bg-black/20 p-2">
                                          <div className="mb-1 text-[10px] uppercase tracking-wide text-indigo-300">{item.sourceType || 'evidence'} · {item.reference || item.id}</div>
                                          <p className="line-clamp-3">{item.excerpt || (isAr ? 'لا يوجد مقتطف محفوظ' : isDe ? 'Kein Auszug gespeichert' : 'No excerpt stored')}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-red-300/80">{isAr ? 'لا يوجد دليل مرتبط بهذا الادعاء.' : isDe ? 'Für diese Aussage wurde kein Nachweis gefunden.' : 'No linked evidence was found for this claim.'}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      ) : null}
                    </div>
                  );
                })()}
                {conflict?.draftId === draft.id && editingId === draft.id && (
                  <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4" role="alert">
                    <div className="flex items-start gap-3">
                      <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-300" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-amber-100">{copy.conflictTitle}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-amber-100/75">{copy.conflictDescription}</p>
                        {!conflict.serverAvailable && <p className="mt-2 text-xs text-amber-200/80">{copy.latestUnavailable}</p>}
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div>
                            <div className="mb-1 text-xs font-bold text-slate-300">{copy.localVersion}</div>
                            <textarea value={conflict.localContent} readOnly className="h-32 w-full resize-none rounded-lg border border-white/10 bg-slate-950/80 p-3 text-xs leading-relaxed text-slate-300" aria-label={copy.localVersion} />
                          </div>
                          <div>
                            <div className="mb-1 text-xs font-bold text-slate-300">{copy.serverVersion}</div>
                            <textarea value={conflict.serverContent} readOnly className="h-32 w-full resize-none rounded-lg border border-white/10 bg-slate-950/80 p-3 text-xs leading-relaxed text-slate-300" aria-label={copy.serverVersion} />
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button type="button" onClick={() => resolveConflict('local')} className="rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/30" disabled={!conflict.serverAvailable}>
                            {copy.keepLocal}
                          </button>
                          <button type="button" onClick={() => resolveConflict('server')} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-slate-600" disabled={!conflict.serverAvailable}>
                            {copy.useLatest}
                          </button>
                          <button type="button" onClick={() => resolveConflict('merge')} className="rounded-lg bg-indigo-500/20 px-3 py-2 text-xs font-bold text-indigo-100 hover:bg-indigo-500/30" disabled={!conflict.serverAvailable}>
                            {copy.mergeVersions}
                          </button>
                          <button type="button" onClick={() => resolveConflict('dismiss')} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10">
                            {copy.dismissConflict}
                          </button>
                        </div>
                        {conflict.serverAvailable && <p className="mt-2 text-xs text-slate-400">{copy.mergeHint}</p>}
                      </div>
                    </div>
                  </div>
                )}
                {previewDraftId === draft.id ? (
                  <div className="mx-auto max-w-2xl rounded-2xl border border-indigo-500/20 bg-white p-6 text-left shadow-xl" dir="auto" aria-label={copy.preview}>
                    <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 text-xs text-slate-500">
                      <span className="font-semibold">LinkedIn Authority</span>
                      <span>{editingId === draft.id ? editContent.length : getDisplayText(draft.content).length} {copy.characters}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-800">{editingId === draft.id ? editContent : getDisplayText(draft.content)}</p>
                  </div>
                ) : editingId === draft.id ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 resize-none font-mono"
                    placeholder={isAr ? 'اكتب محتوى المنشور هنا...' : isDe ? 'Entwurfsinhalt hier eingeben …' : 'Write post content here...'}
                    dir="auto"
                    aria-label="Draft post"
                  />
                ) : (
                  <div className="bg-slate-950 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
                    {getDisplayText(draft.content)}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500" aria-label={`${editingId === draft.id ? editContent.length : getDisplayText(draft.content).length} ${copy.characters}`}>
                  <span>{editingId === draft.id ? editContent.length : getDisplayText(draft.content).length} {copy.characters}</span>
                  {editingId === draft.id && <span>{isAr ? `Revision ${editingRevision || 1}` : `Revision ${editingRevision || 1}`}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../application/AuthContext';
import { firestoreService, DraftData } from '../services/firestoreService';
import { FileText, Save, Copy, Trash2, Edit3, X, Check } from 'lucide-react';

export const DraftsDashboard = ({ lang }: { lang: 'ar' | 'en' | 'de' }) => {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<(DraftData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAr = lang === 'ar';

  useEffect(() => {
    const fetchDrafts = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const data = await firestoreService.getUserDrafts(user.uid);
        // Sort by newest first
        setDrafts(data.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis()) as any);
      } catch (error) {
        console.error("Error fetching drafts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, [user]);

  const handleEdit = (draft: DraftData & { id: string }) => {
    setEditingId(draft.id);
    try {
        const parsed = JSON.parse(draft.content);
        setEditContent(parsed.potentialContent || parsed.changelog || draft.content);
    } catch {
        setEditContent(draft.content);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSave = async (draftId: string) => {
    if (!user) return;
    setSaving(true);
    try {
      // Find original draft to keep its structure if it was JSON
      const originalDraft = drafts.find(d => d.id === draftId);
      let newContentStr = editContent;
      
      if (originalDraft) {
        try {
            const parsed = JSON.parse(originalDraft.content);
            if (parsed.potentialContent) {
                parsed.potentialContent = editContent;
            } else if (parsed.changelog) {
                parsed.changelog = editContent;
            }
            newContentStr = JSON.stringify(parsed);
        } catch {
            // It wasn't JSON, just save raw text
        }
      }

      await firestoreService.updateDraft(user.uid, draftId, { content: newContentStr });
      setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, content: newContentStr } : d));
      setEditingId(null);
    } catch (error) {
      console.error("Error saving draft:", error);
      alert(isAr ? 'فشل الحفظ' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!user) return;
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذه المسودة؟' : 'Are you sure you want to delete this draft?')) return;
    try {
      await firestoreService.deleteDraft(user.uid, draftId);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (error) {
      console.error("Error deleting draft:", error);
    }
  };

  const handleCopy = (content: string, id: string) => {
    let textToCopy = content;
    try {
        const parsed = JSON.parse(content);
        textToCopy = parsed.potentialContent || parsed.changelog || content;
    } catch {
        // Not JSON
    }
    
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDisplayText = (content: string) => {
      try {
          const parsed = JSON.parse(content);
          return parsed.potentialContent || parsed.changelog || content;
      } catch {
          return content;
      }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        {isAr ? 'الرجاء تسجيل الدخول لعرض المسودات' : 'Please log in to view drafts'}
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

  return (
    <div className={`max-w-5xl mx-auto w-full p-4 ${isAr ? 'font-arabic' : 'font-sans'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="text-3xl font-bold text-white mb-2">{isAr ? 'المسودات والمحتوى' : 'Drafts & Content'}</h1>
      <p className="text-slate-400 mb-8">
        {isAr 
            ? 'هنا تجد جميع التحليلات والمنشورات التي قمت بإنشائها. يمكنك تعديلها، ونسخها لنشرها على LinkedIn.'
            : 'Here are all the generated analyses and posts. Edit and copy them for LinkedIn.'}
      </p>

      {drafts.length === 0 ? (
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center">
            <FileText size={48} className="text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-2">{isAr ? 'لا يوجد مسودات حتى الآن' : 'No drafts yet'}</h3>
            <p className="text-sm text-slate-500 max-w-md">
                {isAr ? 'قم باختيار مستودع من قائمة المشاريع واضغط على "تحليل" لتوليد مسوداتك الأولى.' : 'Select a repository and click Analyze to generate your first drafts.'}
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
                          {copiedId === draft.id ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}
                        </button>
                        <button 
                          onClick={() => handleEdit(draft)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Edit3 size={14} />
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                        <button 
                          onClick={() => handleDelete(draft.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors ml-2"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                  ) : (
                      <>
                        <button 
                          onClick={() => handleSave(draft.id)}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          <Save size={14} />
                          {saving ? (isAr ? 'جاري الحفظ' : 'Saving') : (isAr ? 'حفظ' : 'Save')}
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                        >
                          <X size={14} />
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      </>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                {editingId === draft.id ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 resize-none font-mono"
                    placeholder={isAr ? 'اكتب محتوى المنشور هنا...' : 'Write post content here...'}
                    dir="auto"
                  />
                ) : (
                  <div className="bg-slate-950 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
                    {getDisplayText(draft.content)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

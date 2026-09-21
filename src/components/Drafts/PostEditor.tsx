import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../application/AuthContext';
import { 
  Copy, RefreshCw, CheckCircle2, FileText, ClipboardCheck, Sparkles,
  Bold, Flame, List, CornerDownLeft, MessageSquare, Send, Terminal, HelpCircle,
  Cpu, GraduationCap, BookOpen, Skull
} from 'lucide-react';
import { t } from '../../constants';

const calculateQualityScore = (text: string) => {
  let score = 0;
  if (!text) return 0;
  const len = text.length;
  if (len >= 300 && len <= 800) score += 30;
  else if (len > 0) score += 15;
  const firstPart = text.slice(0, 100);
  if (/[؟!؟!\u{1F300}-\u{1F9FF}]/u.test(firstPart)) score += 20;
  const lastPart = text.slice(-200);
  if (/[؟!؟!]/.test(lastPart) || lastPart.includes("رأيكم") || lastPart.includes("شارك")) score += 20;
  const hashtagsCount = (text.match(/#/g) || []).length;
  if (hashtagsCount >= 5) score += 15;
  else if (hashtagsCount >= 2) score += 10;
  const paragraphsCount = (text.match(/\n\s*\n/g) || []).length;
  if (paragraphsCount >= 2) score += 15;
  else if (paragraphsCount >= 1) score += 10;
  return Math.min(score, 100);
};

export const PostEditor = ({ lang, currentPost, handleUpdatePostText, settings, showToast }: any) => {
  const isAr = lang === 'ar';
  const isDe = lang === 'de';
  const ui = {
    editor: isAr ? '✏️ محرر المنشور الذكي' : isDe ? '✏️ Intelligenter Entwurfseditor' : '✏️ AI Workspace Editor',
    autosaved: isAr ? 'حفظ تلقائي ✓' : isDe ? 'Automatisch gespeichert ✓' : 'Auto-saved ✓',
    sync: isAr ? 'تحديث تلقائي مستمر' : isDe ? 'Cloud-Synchronisierung aktiv' : 'Cloud sync active',
    draft: isAr ? 'مسودة' : isDe ? 'Entwurf' : 'Draft',
    restore: isAr ? 'استعادة' : isDe ? 'Wiederherstellen' : 'Restore',
    linkNote: isAr ? 'ملاحظة روابط اختيارية' : isDe ? 'Optionaler Link-Hinweis' : 'Optional Link Note',
    noLinks: isAr ? 'لم يتم اكتشاف روابط في المستودع. يمكنك إضافة روابطك الخاصة هنا.' : isDe ? 'Im Repository wurden keine Links gefunden. Du kannst hier eigene Links ergänzen.' : 'No links discovered in the repository. You can add your own links here.',
    copilot: isAr ? 'عقل الأداة الفائق (تعديلات الذكاء الاصطناعي)' : isDe ? 'KI-Co-Pilot für den Entwurf' : 'AI Brain Co-Pilot',
    refining: isAr ? 'جاري الصياغة...' : isDe ? 'Entwurf wird überarbeitet …' : 'Re-crafting post...',
    clickPreset: isAr ? 'اضغط لتطبيق التعديل الفوري' : isDe ? 'Preset auswählen, um den Text anzupassen' : 'Click preset to morph text',
    voice: isAr ? '👤 نبرة صياغة الكاتب' : isDe ? '👤 Schreibstimme' : '👤 Writing voice',
    safe: isAr ? '⚡ تحسينات تحافظ على الأدلة' : isDe ? '⚡ Evidenzsichere Überarbeitung' : '⚡ Evidence-safe refinement',
    formatters: isAr ? '📝 أدوات التنسيق الأساسية السريعة' : isDe ? '📝 Schnelle Formatierung' : '📝 Standard Quick formatters',
    boldTech: isAr ? 'تغليظ الكلمات التقنية' : isDe ? 'Technische Begriffe hervorheben' : 'Bolden Tech Words',
    hook: isAr ? 'صياغة عنوان خاطف ذكي' : isDe ? 'Prägnanter Einstieg' : 'Punchy Opening Hook',
    hashtags: isAr ? 'توليد الهاشتاجات الذكية (مُوصى به)' : isDe ? 'Intelligente Hashtags (empfohlen)' : 'Smart Hashtag Generator (Recommended)',
    customPrompt: isAr ? 'توجيه إضافي مخصص لعقل الأداة: مثلاً اجعله أبسط...' : isDe ? 'Eigene Vorgabe: z. B. einfacher erklären oder Aufzählungen ergänzen …' : 'Custom guidelines: e.g. explain recursively, add bullet points...',
    refine: isAr ? 'إرسال' : isDe ? 'Überarbeiten' : 'Refine',
    restored: isAr ? 'تمت الاستعادة بنجاح!' : isDe ? 'Originaltext wiederhergestellt!' : 'Original text restored!',
    copiedPost: isAr ? 'تم نسخ منشورك بنجاح!' : isDe ? 'Entwurf in die Zwischenablage kopiert!' : 'Post copied to clipboard!',
    copyFailed: isAr ? 'تعذر النسخ إلى الحافظة. انسخ النص يدوياً من المحرر.' : isDe ? 'Der Entwurf konnte nicht kopiert werden. Kopiere ihn bitte manuell aus dem Editor.' : 'Copy failed. Please copy the text manually from the editor.',
    hashtagsFailed: isAr ? 'تعذر توليد الهاشتاجات حالياً. حاول مرة أخرى.' : isDe ? 'Hashtags konnten nicht erzeugt werden. Bitte erneut versuchen.' : 'Hashtags could not be generated. Try again.',
    optimizeFailed: isAr ? 'تعذر تحسين المسودة حالياً. لم يتم تغيير النص.' : isDe ? 'Der Entwurf konnte nicht überarbeitet werden. Der Text wurde nicht geändert.' : 'The draft could not be refined. Your text was not changed.',
    confirmRestore: isAr ? 'هل أنت متأكد من استعادة النص الأصلي ومسح تعديلاتك؟' : isDe ? 'Möchtest du wirklich den Originaltext wiederherstellen und deine Änderungen verwerfen?' : 'Are you sure you want to restore the original text and discard your changes?',
    bold: isAr ? 'عريض' : isDe ? 'Fett (Unicode)' : 'Bold (Unicode)',
    bullets: isAr ? 'قائمة نقطية' : isDe ? 'Aufzählung' : 'Bullet List',
    lineBreak: isAr ? 'فاصل أسطر' : isDe ? 'Zeilenumbruch' : 'Line Break',
    technical: isAr ? 'تقني واضح' : isDe ? 'Technisch klar' : 'Technical',
    minimalist: isAr ? 'مهندس صارم' : isDe ? 'Minimalistisch' : 'Minimalist',
    scholar: isAr ? 'أكاديمي باحث' : isDe ? 'Wissenschaftlich' : 'Scholar',
    mentor: isAr ? 'موجه قصصي' : isDe ? 'Mentor' : 'Mentor',
    cynic: isAr ? 'واقعي ساخر' : isDe ? 'Pragmatisch-sarkastisch' : 'Cynic',
  };
  
  // Auto-saved show/hide indicator state
  const [showAutoSaveTick, setShowAutoSaveTick] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const [localText, setLocalText] = useState(currentPost?.text || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = (type: 'bold' | 'bullet' | 'linebreak') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = localText;
    
    let newText = text;
    let newSelectionStart = start;
    let newSelectionEnd = end;

    if (type === 'bold') {
      const selected = text.substring(start, end);
      if (selected) {
        // basic unicode bold mapping for English characters
        const toUnicodeBold = (str: string) => {
          return str.replace(/[A-Za-z0-9]/g, (char) => {
             const code = char.charCodeAt(0);
             if (code >= 65 && code <= 90) return String.fromCodePoint(code + 119743); // A-Z
             if (code >= 97 && code <= 122) return String.fromCodePoint(code + 119737); // a-z
             if (code >= 48 && code <= 57) return String.fromCodePoint(code + 120764); // 0-9
             return char;
          });
        };
        const bolded = toUnicodeBold(selected);
        newText = text.substring(0, start) + bolded + text.substring(end);
        newSelectionEnd = start + bolded.length;
      }
    } else if (type === 'bullet') {
      const selected = text.substring(start, end) || " ";
      const bulleted = selected.split('\n').map(line => `• ${line}`).join('\n');
      newText = text.substring(0, start) + bulleted + text.substring(end);
      newSelectionEnd = start + bulleted.length;
    } else if (type === 'linebreak') {
      const breaks = '\n\n';
      newText = text.substring(0, start) + breaks + text.substring(end);
      newSelectionStart = start + breaks.length;
      newSelectionEnd = start + breaks.length;
    }

    setLocalText(newText);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newSelectionStart;
        textareaRef.current.selectionEnd = newSelectionEnd;
        textareaRef.current.focus();
      }
    }, 0);
  };

  useEffect(() => {
    setLocalText(currentPost?.text || "");
  }, [currentPost?.id]);

  useEffect(() => {
    if (localText !== undefined && localText !== currentPost?.text) {
      const timeout = setTimeout(() => {
        handleUpdatePostText(localText);
        setShowAutoSaveTick(true);
        setTimeout(() => setShowAutoSaveTick(false), 2000);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [localText, currentPost?.text, handleUpdatePostText]);

  // New interactive optimization state
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [customPromptInput, setCustomPromptInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSmartHashtags = async () => {
    if (!localText) return;
    setActionError(null);
    setOptimizing('hashtags');
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/generate-hashtags", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ text: localText, lang })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hashtags && data.hashtags.length > 0) {
          const updatedText = localText + '\n\n' + data.hashtags.join(' ');
          setLocalText(updatedText);
          handleUpdatePostText(updatedText);
        showToast(isAr ? "تم إضافة الهاشتاجات الذكية بنجاح!" : isDe ? "Intelligente Hashtags hinzugefügt!" : "Smart hashtags added!");
        }
      } else {
        setActionError(ui.hashtagsFailed);
      }
    } catch {
      setActionError(ui.hashtagsFailed);
    } finally {
      setOptimizing(null);
    }
  };

  const handleOptimize = async (actionType: string) => {
    if (!localText) return;
    setActionError(null);
    setOptimizing(actionType);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/optimize-post", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          text: localText,
          actionType,
          customPrompt: actionType === 'custom' ? customPromptInput : undefined,
          lang
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalText(data.optimizedText);
        handleUpdatePostText(data.optimizedText);
        showToast(isAr ? "تم إرسال المنشور لعقل الأداة وتعديله بنجاح! ✨" : isDe ? "KI-Überarbeitung erfolgreich angewendet! ✨" : "Brain optimization applied successfully! ✨");
        if (actionType === 'custom') setCustomPromptInput("");
      } else {
        setActionError(ui.optimizeFailed);
      }
    } catch {
      setActionError(ui.optimizeFailed);
    } finally {
      setOptimizing(null);
    }
  };

  useEffect(() => {
    if (currentPost?.text && currentPost?.text === localText) {
      // Just visually trigger the tick when external updates match localText
      setShowAutoSaveTick(true);
      const t = setTimeout(() => setShowAutoSaveTick(false), 2000);
      return () => clearTimeout(t);
    }
  }, [currentPost?.text]);

  const qualityScore = calculateQualityScore(localText || "");

  const handleCopy = async () => {
    let textToCopy = localText || "";
    if (currentPost.suggestedComment) {
      textToCopy += `\n\n--- Optional Link Note ---\n${currentPost.suggestedComment}`;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setActionError(null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast(ui.copiedPost);
    } catch {
      setActionError(ui.copyFailed);
    }
  };

  const getStatusBadge = () => {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-500/10 text-amber-550 border border-amber-500/20">
        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
        <span>{ui.draft}</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pr-1">
      {actionError && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert" aria-live="assertive">
          <span className="flex-1">{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="text-xs font-bold underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-rose-300">
            {isAr ? 'إخفاء' : isDe ? 'Ausblenden' : 'Dismiss'}
          </button>
        </div>
      )}
      
      {/* Editor Header Card */}
      <div className="flex items-center justify-between mb-4 bg-slate-800 border border-white/5 p-3.5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-black text-slate-200 tracking-wider uppercase block">
              {ui.editor}
            </h3>
            {showAutoSaveTick ? (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold animate-pulse">
                <CheckCircle2 className="w-3 h-3" />
                <span>{ui.autosaved}</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-medium">
                {ui.sync}
              </span>
            )}
          </div>
        </div>

        {/* Status indicator on the right side */}
        <div className="flex items-center gap-2">
          {currentPost.originalText && currentPost.originalText !== localText && (
            <button 
              type="button"
              onClick={() => {
                if (window.confirm(ui.confirmRestore)) {
                  setLocalText(currentPost.originalText);
                  handleUpdatePostText(currentPost.originalText);
                  showToast(ui.restored);
                }
              }}
              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10.5px] font-bold flex items-center gap-1.5 transition-all"
              title={isAr ? 'استعادة النص الأصلي' : isDe ? 'Originalen KI-Text wiederherstellen' : 'Restore Original AI Text'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
                <span>{ui.restore}</span>
            </button>
          )}
          {getStatusBadge()}
          <button 
            type="button"
            onClick={handleCopy}
            className="p-1.5 bg-slate-900 hover:bg-slate-950 transition-all text-slate-400 hover:text-white border border-white/5 rounded-xl cursor-pointer"
            title="Copy entire post text"
          >
            {copied ? <ClipboardCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Styled Rich Textarea */}
      <div className="flex-1 flex flex-col mb-4 bg-slate-800 border border-white/5 rounded-2xl relative shadow-xl focus-within:border-indigo-500/50 transition-all overflow-hidden">
        
        {/* Rich Text Toolbar */}
        <div className="flex items-center gap-1.5 p-2 border-b border-white/5 bg-slate-900/50">
          <button
            onClick={() => handleFormat('bold')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-white/10"
            title={ui.bold}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFormat('bullet')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-white/10"
            title={ui.bullets}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFormat('linebreak')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-white/10"
            title={ui.lineBreak}
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          placeholder={t[lang].postPlaceholder}
          className={`w-full text-xs md:text-[13.5px] text-slate-100 leading-relaxed p-5 focus:outline-none resize-none bg-transparent custom-scrollbar min-h-[220px] pb-12 ${isAr ? 'text-right' : 'text-left'}`}
          dir={isAr ? "rtl" : "ltr"}
        />

        <div className="mx-5 mb-14 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl group relative">
          {currentPost?.suggestedComment && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentPost.suggestedComment!);
                showToast(isAr ? "تم نسخ ملاحظة الروابط بنجاح!" : isDe ? "Link-Hinweis kopiert!" : "Link note copied!");
              }}
              className="absolute top-2 right-2 p-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              title={isAr ? "نسخ ملاحظة الروابط" : isDe ? "Link-Hinweis kopieren" : "Copy link note"}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          <h4 className={`text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-1 ${isAr ? 'text-right' : 'text-left'}`}>
            {ui.linkNote}
          </h4>
          <p className={`text-xs text-indigo-200/80 whitespace-pre-wrap ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? "rtl" : "ltr"}>
            {currentPost?.suggestedComment || ui.noLinks}
          </p>
        </div>

        {/* Quality indicator and progress bar in the editor footer */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-white/5 text-[10.5px]">
            <span className="text-slate-500 font-bold">{isAr ? 'تقييم المسودة:' : isDe ? 'Entwurfsbewertung:' : 'Draft score:'}</span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300
                  ${qualityScore > 75 ? 'bg-emerald-500' : qualityScore > 45 ? 'bg-amber-500' : 'bg-rose-500'}
                `}
                style={{ width: `${qualityScore}%` }}
              />
            </div>
            <span className={`font-black
              ${qualityScore > 75 ? 'text-emerald-400' : qualityScore > 45 ? 'text-amber-400' : 'text-rose-450'}
            `}>
              {qualityScore}/100
            </span>
          </div>

          <div className="flex gap-2 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-white/5 font-mono text-[10px] text-slate-400">
            <span>{currentPost.text.length} {isAr ? 'حرف' : isDe ? 'Zeichen' : 'chars'}</span>
            <span>•</span>
            <span>{currentPost.text.split(/\s+/).filter(Boolean).length} {isAr ? 'كلمة' : isDe ? 'Wörter' : 'words'}</span>
          </div>
        </div>

      </div>

      {/* LinkedIn Interactive Refiner Toolbar */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 mb-4 space-y-4 shadow-md">
        
        {/* Core Status & Title bar */}
        <div className="flex items-center justify-between pb-1 border-b border-white/5">
          <span className="text-[11px] font-black text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{ui.copilot}</span>
          </span>
          {optimizing ? (
            <span className="text-[10px] text-indigo-400 font-extrabold animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>{ui.refining}</span>
            </span>
          ) : (
            <span className="text-[10.5px] text-slate-500 font-semibold select-none">
              {ui.clickPreset}
            </span>
          )}
        </div>

        {/* SECTION 1: Personal Style Archetypes Generator */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase block text-left">
            {ui.voice}
          </span>
          
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => handleOptimize('style-influencer')}
              disabled={!!optimizing || !localText}
              className="flex flex-col items-center gap-1 py-2 px-1 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-center border border-white/5 transition-all cursor-pointer hover:border-indigo-500/35"
              title={isAr ? "صياغة تقنية واضحة وحيوية مع الحفاظ على الحقائق الموثقة" : "Clear, energetic technical writing grounded in verified facts"}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[9px] font-bold text-slate-200 truncate max-w-full">
                {ui.technical}
              </span>
            </button>

            <button
              onClick={() => handleOptimize('style-minimalist')}
              disabled={!!optimizing || !localText}
              className="flex flex-col items-center gap-1 py-2 px-1 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-center border border-white/5 transition-all cursor-pointer hover:border-indigo-500/35"
              title={isAr ? "تحويل لأسلوب معماري مباشر، رصين، خالٍ تماماً من الحشو والرموز التعبيرية غير اللازمة" : "Minimalist Software Architect: zero-fluff, code-focused"}
            >
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] font-bold text-slate-200 truncate max-w-full">
                {ui.minimalist}
              </span>
            </button>

            <button
              onClick={() => handleOptimize('style-academic')}
              disabled={!!optimizing || !localText}
              className="flex flex-col items-center gap-1 py-1.5 px-1 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-center border border-white/5 transition-all cursor-pointer hover:border-indigo-500/35"
              title={isAr ? "يربط المشروع بمبادئ علوم الحاسب والمناهج البحثية والخوارزميات بصورة علمية راقية" : "Computer Science Scholar: links tools to scientific foundations"}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[9px] font-bold text-slate-200 truncate max-w-full">
                {ui.scholar}
              </span>
            </button>

            <button
              onClick={() => handleOptimize('style-storyteller')}
              disabled={!!optimizing || !localText}
              className="flex flex-col items-center gap-1 py-2 px-1 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-center border border-white/5 transition-all cursor-pointer hover:border-indigo-500/35"
              title={isAr ? "أعد صياغة البوست كقصة ملهمة لخطأ بالإنتاج والدروس وتوجيهات رائعة للمطورين" : "Narrative Mentor Storyteller: failures & production lessons"}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[9px] font-bold text-slate-200 truncate max-w-full">
                {ui.mentor}
              </span>
            </button>

            <button
              onClick={() => handleOptimize('style-cynical')}
              disabled={!!optimizing || !localText}
              className="flex flex-col items-center gap-1 py-2 px-1 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-center border border-white/5 transition-all cursor-pointer hover:border-indigo-500/35"
              title={isAr ? "فلسفة ساخرة عميقة حول معارك الإنتاج وأخطاء البنية التحتية والديون التقنية" : "Cynical Pragmatist: humorous realistic takes on technical debt"}
            >
              <Skull className="w-3.5 h-3.5 text-rose-450" />
              <span className="text-[9px] font-bold text-slate-200 truncate max-w-full">
                {ui.cynic}
              </span>
            </button>
          </div>
        </div>

        {/* SECTION 2: Evidence-safe draft refinement */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase block text-left">
            {ui.safe}
          </span>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            {isAr ? 'تعديلات الصياغة لا تضيف أرقاماً أو إنجازات جديدة إلى المسودة.' : isDe ? 'Überarbeitungen bewahren Fakten, Zahlen, Links und Unsicherheiten des Entwurfs.' : 'Refinements preserve the draft’s facts, numbers, links, and uncertainty.'}
          </p>
        </div>

        {/* SECTION 3: Standard Fast Actions Row */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase block text-left">
            {ui.formatters}
          </span>
          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOptimize('unicode')}
                disabled={!!optimizing || !localText}
                className="flex items-center gap-2 justify-center py-2 px-3 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-[11px] border border-white/5 text-slate-200 transition-all font-bold cursor-pointer hover:border-indigo-500/35"
              >
                <Bold className="w-3.5 h-3.5 text-indigo-400" />
                <span>{ui.boldTech}</span>
              </button>
  
              <button
                onClick={() => handleOptimize('hook')}
                disabled={!!optimizing || !localText}
                className="flex items-center gap-2 justify-center py-2 px-3 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-[11px] border border-white/5 text-slate-200 transition-all font-bold cursor-pointer hover:border-indigo-500/35"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{ui.hook}</span>
              </button>
            </div>
            
            <button
              onClick={handleSmartHashtags}
              disabled={!!optimizing || !localText}
              className="flex items-center gap-2 justify-center py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-40 rounded-xl text-[11px] border border-indigo-500/30 text-indigo-300 transition-all font-bold cursor-pointer w-full shadow-[0_0_15px_rgba(99,102,241,0.15)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{ui.hashtags}</span>
            </button>
          </div>
        </div>

        {/* Custom refinement input bar */}
        <div className="flex gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/5 items-center">
          <input
            type="text"
            value={customPromptInput}
            onChange={(e) => setCustomPromptInput(e.target.value)}
            disabled={!!optimizing}
            placeholder={ui.customPrompt}
            className="flex-1 bg-transparent text-[11px] px-2 text-white focus:outline-none placeholder-slate-600 font-bold"
          />
          <button
            onClick={() => handleOptimize('custom')}
            disabled={!!optimizing || !customPromptInput.trim() || !localText}
            className="h-7 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 rounded-lg text-[10px] text-white font-black flex items-center justify-center gap-1 cursor-pointer select-none"
          >
            <Send className="w-3 h-3" />
            <span>{ui.refine}</span>
          </button>
        </div>
      </div>

    </div>
  );
};

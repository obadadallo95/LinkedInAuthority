import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../application/AuthContext';
import { 
  Copy, RefreshCw, CheckCircle2, FileText, Share2, ClipboardCheck, Sparkles, 
  Bold, Flame, List, CornerDownLeft, MessageSquare, Send, Terminal, HelpCircle, Newspaper, 
  TrendingUp, Cpu, GraduationCap, BookOpen, Skull, BadgeHelp
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

  const handleSmartHashtags = async () => {
    if (!localText) return;
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
          showToast(isAr ? "تم إضافة الهاشتاجات الذكية بنجاح!" : "Smart hashtags added!");
        }
      } else {
        showToast("Failed to generate hashtags");
      }
    } catch (e: any) {
      showToast("Hashtag generation failed.");
    } finally {
      setOptimizing(null);
    }
  };

  const handleOptimize = async (actionType: string) => {
    if (!localText) return;
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
        showToast(isAr ? "تم إرسال المنشور لعقل الأداة وتعديله بنجاح! ✨" : "Brain optimization applied successfully! ✨");
        if (actionType === 'custom') setCustomPromptInput("");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to optimize post");
      }
    } catch (e: any) {
      showToast("Optimization request failed.");
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
      textToCopy += `\n\n--- Suggested Comment ---\n${currentPost.suggestedComment}`;
    }
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast(isAr ? "تم نسخ منشورك بنجاح!" : "Post copied to clipboard!");
  };

  const getStatusBadge = () => {
    if (currentPost.status === 'published') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span>{isAr ? 'نُشر' : 'Published'}</span>
        </span>
      );
    }
    if (currentPost.status === 'scheduled') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
          <span>{isAr ? 'مجدول' : 'Scheduled'}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-500/10 text-amber-550 border border-amber-500/20">
        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
        <span>{isAr ? 'مسودة' : 'Draft'}</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pr-1">
      
      {/* Editor Header Card */}
      <div className="flex items-center justify-between mb-4 bg-slate-800 border border-white/5 p-3.5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-black text-slate-200 tracking-wider uppercase block">
              {isAr ? '✏️ محرر المنشور الذكي' : '✏️ AI Workspace Editor'}
            </h3>
            {showAutoSaveTick ? (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold animate-pulse">
                <CheckCircle2 className="w-3 h-3" />
                <span>{isAr ? 'حفظ تلقائي ✓' : 'Auto-saved ✓'}</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-medium">
                {isAr ? 'تحديث تلقائي مستمر' : 'Cloud sync active'}
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
                if (window.confirm(isAr ? "هل أنت متأكد من استعادة النص الأصلي ومسح تعديلاتك؟" : "Are you sure you want to restore the original text and discard your changes?")) {
                  setLocalText(currentPost.originalText);
                  handleUpdatePostText(currentPost.originalText);
                  showToast(isAr ? "تمت الاستعادة بنجاح!" : "Original text restored!");
                }
              }}
              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10.5px] font-bold flex items-center gap-1.5 transition-all"
              title={isAr ? 'استعادة النص الأصلي' : 'Restore Original AI Text'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isAr ? 'استعادة' : 'Restore'}</span>
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
            title={isAr ? 'عريض' : 'Bold (Unicode)'}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFormat('bullet')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-white/10"
            title={isAr ? 'قائمة نقطية' : 'Bullet List'}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFormat('linebreak')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer border border-transparent hover:border-white/10"
            title={isAr ? 'فاصل أسطر' : 'Line Break'}
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

        {currentPost?.suggestedComment && (
          <div className="mx-5 mb-14 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl group relative">
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentPost.suggestedComment!);
                showToast(isAr ? "تم نسخ التعليق بنجاح!" : "Comment copied!");
              }}
              className="absolute top-2 right-2 p-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              title={isAr ? "نسخ التعليق" : "Copy comment"}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <h4 className={`text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-1 ${isAr ? 'text-right' : 'text-left'}`}>
              {isAr ? 'التعليق المقترح (يحتوي على الروابط)' : 'Suggested Comment (Links)'}
            </h4>
            <p className={`text-xs text-indigo-200/80 whitespace-pre-wrap ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? "rtl" : "ltr"}>
              {currentPost.suggestedComment}
            </p>
          </div>
        )}

        {/* Quality indicator and progress bar in the editor footer */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-white/5 text-[10.5px]">
            <span className="text-slate-500 font-bold">Post Score:</span>
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
            <span>{currentPost.text.length} chars</span>
            <span>•</span>
            <span>{currentPost.text.split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>

      </div>

      {/* LinkedIn Interactive Refiner Toolbar */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 mb-4 space-y-4 shadow-md">
        
        {/* Core Status & Title bar */}
        <div className="flex items-center justify-between pb-1 border-b border-white/5">
          <span className="text-[11px] font-black text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isAr ? 'عقل الأداة الفائق (تعديلات الذكاء الاصطناعي)' : 'AI Brain Co-Pilot'}</span>
          </span>
          {optimizing ? (
            <span className="text-[10px] text-indigo-400 font-extrabold animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>{isAr ? 'جاري الصياغة...' : 'Re-crafting post...'}</span>
            </span>
          ) : (
            <span className="text-[10.5px] text-slate-500 font-semibold select-none">
              {isAr ? 'اضغط لتطبيق التعديل الفوري' : 'Click preset to morph text'}
            </span>
          )}
        </div>

        {/* SECTION 1: Personal Style Archetypes Generator */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase block text-left">
            {isAr ? '👤 هوية ونبرة صياغة الكاتب (Style Personas)' : '👤 LinkedIn Writing Personas'}
          </span>
          
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => handleOptimize('style-influencer')}
              disabled={!!optimizing || !localText}
              className="flex flex-col items-center gap-1 py-2 px-1 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-center border border-white/5 transition-all cursor-pointer hover:border-indigo-500/35"
              title={isAr ? "تحويل لنبرة المؤثرين التقنيين مفعم بالطاقة والأرقام والخطافات الفيروسية" : "Silicon Valley Viral Tech Influencer: rich in hooks & metrics"}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[9px] font-bold text-slate-200 truncate max-w-full">
                {isAr ? 'مؤثر تقني' : 'Influencer'}
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
                {isAr ? 'مهندس صارم' : 'Minimalist'}
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
                {isAr ? 'أكاديمي باحث' : 'Scholar'}
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
                {isAr ? 'موجه قصصي' : 'Mentor'}
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
                {isAr ? 'واقعي ساخر' : 'Cynic'}
              </span>
            </button>
          </div>
        </div>

        {/* SECTION 2: Advanced Technical Content Enhancements */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase block text-left">
            {isAr ? '⚡ أدوات ومضاعفات النشر التقنية الفائقة' : '⚡ Advanced Interactive Tech Boosters'}
          </span>

          <div className="grid grid-cols-2 gap-2">
            
            <button
              onClick={() => handleOptimize('add-ascii-architecture')}
              disabled={!!optimizing || !localText}
              className="flex items-center gap-2 justify-start py-2 px-3 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-[11px] border border-white/5 text-slate-200 transition-all font-bold cursor-pointer hover:border-indigo-500/35"
              title={isAr ? "توليد مخطط هيكلي بالرموز التعبيرية والآسكي لتدفق المعمارية ووضعه بالبوست" : "Generate and inject custom ASCII System Design diagram into the post text"}
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isAr ? '📊 مخطط الآسكي المعماري' : 'ASCII System Blueprint'}</span>
            </button>

            <button
              onClick={() => handleOptimize('add-tech-quiz')}
              disabled={!!optimizing || !localText}
              className="flex items-center gap-2 justify-start py-2 px-3 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-[11px] border border-white/5 text-slate-200 transition-all font-bold cursor-pointer hover:border-indigo-500/35"
              title={isAr ? "تضمين لغز برمجي / سؤال اختيارات تفاعلي في نهاية المنشور لزيادة التعليقات" : "Generate relevant 3-choice tech riddle/quiz at the end of post to boost comments"}
            >
              <BadgeHelp className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? '💡 تحدي اختبار برمجي' : 'Interactive Tech Quiz'}</span>
            </button>

            <button
              onClick={() => handleOptimize('adapt-x-thread')}
              disabled={!!optimizing || !localText}
              className="flex items-center gap-2 justify-start py-2 px-3 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-[11px] border border-white/5 text-slate-200 transition-all font-bold cursor-pointer hover:border-indigo-500/35"
              title={isAr ? "تحويل المنشور لمجموعة ثريدات تويتر مرقمة بذكاء ومناسبة لحدود الحروف" : "Adapt & split the text into a numbered Twitter/X thread format"}
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{isAr ? '🐦 تحويل لثريد تويتر (X)' : 'Convert to X Thread'}</span>
            </button>

            <button
              onClick={() => handleOptimize('adapt-medium')}
              disabled={!!optimizing || !localText}
              className="flex items-center gap-2 justify-start py-2 px-3 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-[11px] border border-white/5 text-slate-200 transition-all font-bold cursor-pointer hover:border-indigo-500/35"
              title={isAr ? "تحويل المنشور إلى مسودة مقال مفصل لمنصة ميديوم مع عناوين مقروءة" : "Generate deeply structured Medium/Dev.to article blueprint with clear headers"}
            >
              <Newspaper className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? '✍️ تحويل لمقال Medium' : 'Adapt to Medium Intro'}</span>
            </button>

          </div>

          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <button
              onClick={() => handleOptimize('optimize-seo-pillars')}
              disabled={!!optimizing || !localText}
              className="flex items-center gap-2 justify-center py-2 px-3 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-[11px] border border-white/5 text-slate-200 transition-all font-bold cursor-pointer hover:border-indigo-500/35 col-span-2 text-indigo-300 hover:text-indigo-200"
              title={isAr ? "إثراء النص بالكلمات الدلالية ومترابطات محركات البحث والظهور لرفع الأثر" : "Boost SEO terms and key authoritative phrases for social feed reach"}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isAr ? '🔍 قوة سيو الكلمات الدلالية الفائقة' : 'Semantic SEO Keywords Booster'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 3: Standard Fast Actions Row */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase block text-left">
            {isAr ? '📝 أدوات التنسيق الأساسية السريعة' : '📝 Standard Quick formatters'}
          </span>
          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOptimize('unicode')}
                disabled={!!optimizing || !localText}
                className="flex items-center gap-2 justify-center py-2 px-3 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-[11px] border border-white/5 text-slate-200 transition-all font-bold cursor-pointer hover:border-indigo-500/35"
              >
                <Bold className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isAr ? 'تغليظ الكلمات التقنية' : 'Bolden Tech Words'}</span>
              </button>
  
              <button
                onClick={() => handleOptimize('hook')}
                disabled={!!optimizing || !localText}
                className="flex items-center gap-2 justify-center py-2 px-3 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-[11px] border border-white/5 text-slate-200 transition-all font-bold cursor-pointer hover:border-indigo-500/35"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'صياغة عنوان خاطف ذكي' : 'Punchy Opening Hook'}</span>
              </button>
            </div>
            
            <button
              onClick={handleSmartHashtags}
              disabled={!!optimizing || !localText}
              className="flex items-center gap-2 justify-center py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-40 rounded-xl text-[11px] border border-indigo-500/30 text-indigo-300 transition-all font-bold cursor-pointer w-full shadow-[0_0_15px_rgba(99,102,241,0.15)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{isAr ? 'توليد الهاشتاجات الذكية (مُوصى به)' : 'Smart Hashtag Generator (Recommended)'}</span>
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
            placeholder={isAr ? 'توجيه إضافي مخصص لعقل الأداة: مثلاً اجعله أبسط...' : 'Custom guidelines: e.g. explain recursively, add bullet points...'}
            className="flex-1 bg-transparent text-[11px] px-2 text-white focus:outline-none placeholder-slate-600 font-bold"
          />
          <button
            onClick={() => handleOptimize('custom')}
            disabled={!!optimizing || !customPromptInput.trim() || !localText}
            className="h-7 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 rounded-lg text-[10px] text-white font-black flex items-center justify-center gap-1 cursor-pointer select-none"
          >
            <Send className="w-3 h-3" />
            <span>{isAr ? 'إرسال' : 'Refine'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};


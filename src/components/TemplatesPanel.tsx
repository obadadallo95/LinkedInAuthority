import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Search, Trash2, BookOpen, Layers, 
  ArrowRight, Check, Copy, RefreshCw, FileText,
  Link2, Bookmark, HelpCircle
} from 'lucide-react';
import { t } from '../constants';

interface TemplatesPanelProps {
  lang: 'ar' | 'en' | 'de';
  posts: any[];
  postsError?: boolean;
  handleUseTemplate: (template: any) => void | Promise<void>;
  handleDeletePost: (id: string) => void | Promise<void>;
  setActiveTab: (tab: any) => void;
  showToast: (msg: string) => void;
}

const customI18n: Record<string, any> = {
  ar: {
    templatesTitle: "مكتبة القوالب الذكية",
    templatesDesc: "اختر قالباً احترافياً، خصّص متغيراته، ثم استخدمه كنقطة بداية لمسودة تراجعها وتنسخها يدوياً.",
    templateTrustNote: "القالب نقطة بداية فقط؛ استبدل كل متغير بحقيقة موثقة من مشروعك قبل الحفظ أو النسخ.",
    searchPlaceholder: "ابحث عن قالب...",
    filterAll: "الكل",
    filterBuiltIn: "القوالب الجاهزة",
    filterCustom: "قوالبي الخاصة",
    useTemplateBtn: "استخدام القالب وإنشاء مسودة",
    variablesTitle: "تخصيص المتغيرات",
    previewTitle: "معاينة المنشور المخصّص",
    previewLabel: "مسودة منشور LinkedIn",
    previewSub: "للمراجعة والنسخ اليدوي",
    copiedToast: "تم نسخ النص إلى الحافظة!",
    noCustomTemplates: "لم تقم بحفظ أي قوالب مخصصة حتى الآن.",
    noCustomTemplatesAdvice: "أثناء تعديل أي مسودة في الصفحة الرئيسية، يمكنك الضغط على 'حفظ كقالب' لتظهر هنا للاستخدام المتكرر.",
    deleteTemplateConfirm: "هل أنت متأكد من حذف هذا القالب؟",
    templateActionError: "تعذر تنفيذ العملية على القالب. حاول مرة أخرى.",
    deleteTemplateLabel: "حذف القالب",
    builtInBadge: "جاهز",
    customBadge: "مخصص",
    textCopied: "تم النسخ",
    variablePlaceholder: "اكتب القيمة هنا...",
    noTemplatesFound: "لم يتم العثور على قوالب تطابق البحث."
  },
  en: {
    templatesTitle: "Smart Templates Library",
    templatesDesc: "Select a professional post template, customize its placeholders in real-time, and draft in seconds.",
    templateTrustNote: "Templates are writing scaffolds, not evidence. Replace every placeholder with a verified project fact before saving or copying.",
    searchPlaceholder: "Search templates...",
    filterAll: "All",
    filterBuiltIn: "Built-in",
    filterCustom: "My Templates",
    useTemplateBtn: "Use Template & Create Draft",
    variablesTitle: "Customize Placeholders",
    previewTitle: "Customized Post Preview",
    previewLabel: "LinkedIn draft",
    previewSub: "Review and copy manually",
    copiedToast: "Text copied to clipboard!",
    noCustomTemplates: "No custom templates saved yet.",
    noCustomTemplatesAdvice: "While editing any draft in the Home tab, you can click 'Save as Template' to make it available here.",
    deleteTemplateConfirm: "Are you sure you want to delete this template?",
    templateActionError: "The template action could not be completed. Try again.",
    deleteTemplateLabel: "Delete template",
    builtInBadge: "Built-in",
    customBadge: "Custom",
    textCopied: "Copied",
    variablePlaceholder: "Enter value...",
    noTemplatesFound: "No templates match your search."
  },
  de: {
    templatesTitle: "Vorlagen-Bibliothek",
    templatesDesc: "Wählen Sie eine professionelle Beitragsvorlage, passen Sie die Platzhalter an und erstellen Sie Entwürfe.",
    templateTrustNote: "Vorlagen sind nur Schreibgerüste, keine Belege. Ersetzen Sie jeden Platzhalter vor dem Speichern oder Kopieren durch eine geprüfte Projektangabe.",
    searchPlaceholder: "Vorlagen suchen...",
    filterAll: "Alle",
    filterBuiltIn: "Standard",
    filterCustom: "Meine Vorlagen",
    useTemplateBtn: "Vorlage verwenden & Entwurf erstellen",
    variablesTitle: "Platzhalter anpassen",
    previewTitle: "Vorschau des angepassten Beitrags",
    previewLabel: "LinkedIn-Entwurf",
    previewSub: "Prüfen und manuell kopieren",
    copiedToast: "In Zwischenablage kopiert!",
    noCustomTemplates: "Noch keine eigenen Vorlagen gespeichert.",
    noCustomTemplatesAdvice: "Klicken Sie beim Bearbeiten im Home-Tab auf 'Als Vorlage speichern', um sie hier zu sichern.",
    deleteTemplateConfirm: "Möchten Sie diese Vorlage wirklich löschen?",
    templateActionError: "Die Vorlagenaktion konnte nicht abgeschlossen werden. Bitte erneut versuchen.",
    deleteTemplateLabel: "Vorlage löschen",
    builtInBadge: "Standard",
    customBadge: "Eigene",
    textCopied: "Kopiert",
    variablePlaceholder: "Wert eingeben...",
    noTemplatesFound: "Keine Vorlagen gefunden."
  }
};

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  lang,
  posts,
  postsError = false,
  handleUseTemplate,
  handleDeletePost,
  setActiveTab,
  showToast
}) => {
  const isAr = lang === 'ar';
  const isDe = lang === 'de';
  const custom = customI18n[lang] || customI18n['en'];

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'builtin' | 'custom'>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('static-temp-1');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Static built-in templates
  const staticTemplates = useMemo(() => [
    {
      id: 'static-temp-1',
      status: 'template',
      isBuiltIn: true,
      repoName: isAr ? 'إطلاق مشروع جديد 🚀' : 'Project Launch Announcement 🚀',
      text: isAr 
        ? `تحديث موثق من مشروع [اسم المشروع] 🚀\n\nما الذي تغيّر: [التغيير الموثق].\nلماذا يهم: [الأثر الذي تدعمه الأدلة].\n\nالمصدر للمراجعة: [الرابط]\n\n#هندسة_برمجيات #بناء_علناً #كتابة_تقنية`
        : `A verified project update from [Project Name] 🚀\n\nWhat changed: [Verified change].\nWhy it matters: [Impact you can support with evidence].\n\nSource for review: [Link]\n\n#SoftwareEngineering #BuildInPublic #TechnicalWriting`,
      cardConfig: { title: isAr ? 'إطلاق مشروع جديد' : 'New Project Launch', metrics: isAr ? '[الإصدار الموثق]' : '[Verified Version]', subtitle: isAr ? 'أضف دليلاً' : 'Add evidence', theme: 'purple' }
    },
    {
      id: 'static-temp-2',
      status: 'template',
      isBuiltIn: true,
      repoName: isAr ? 'مشاركة معرفة تقنية (مقال) 🛠️' : 'Technical Deep Dive 🛠️',
      text: isAr 
        ? `🛠️ درس تقني من مشروع [اسم المشروع]\n\nالسؤال أو القيد الهندسي: [السؤال أو القيد].\nالتغيير المدعوم بالدليل: [تغيير تدعمه commit أو diff أو وثيقة].\nما تعلمناه: [درس محدد].\n\nالدليل للمراجعة: [الرابط]\n\n#هندسة_برمجيات #تطوير #قيادة_تقنية`
        : `🛠️ A technical lesson from [Project Name]\n\nEngineering question: [Question or constraint].\nEvidence-backed change: [Change supported by a commit, diff, or document].\nWhat we learned: [Specific lesson].\n\nEvidence to review: [Link]\n\n#Engineering #SoftwareDevelopment #TechnicalLeadership`,
      cardConfig: { title: isAr ? 'نظرة متعمقة' : 'Deep Dive', metrics: isAr ? 'أداء' : 'Performance', subtitle: isAr ? 'هندسة البرمجيات' : 'Software Engineering', theme: 'emerald' }
    },
    {
      id: 'static-temp-3',
      status: 'template',
      isBuiltIn: true,
      repoName: isAr ? 'مساهمة مفتوحة المصدر 🌟' : 'Open Source Release 🌟',
      text: isAr
        ? `🌟 تحديث موثق من مستودع [اسم المشروع]\n\nالحالة الموثقة: [إصدار عام أو مساهمة أو تغيير في المستودع].\nما يمكن للمساهمين مراجعته: [قسم موثق أو issue أو pull request أو commit].\nطريقة المراجعة: [الرابط]\n\n#مفتوح_المصدر #جيتهاب #مجتمع_المطورين`
        : `🌟 A repository update from [Project Name]\n\nVerified status: [Public release, contribution, or repository change].\nWhat contributors can inspect: [Documented area, issue, pull request, or commit].\nHow to review it: [Link]\n\n#OpenSource #GitHub #DeveloperCommunity`,
      cardConfig: { title: isAr ? 'مفتوح المصدر' : 'Open Source', metrics: isAr ? 'مجتمع' : 'Community', subtitle: isAr ? 'شاركنا البناء' : 'Build with us', theme: 'blue' }
    },
    {
      id: 'static-temp-4',
      status: 'template',
      isBuiltIn: true,
      repoName: isAr ? 'الاحتفال بإنجاز (أرقام) 🎉' : 'Milestone Celebration 🎉',
      text: isAr
        ? `🎉 إنجاز قابل للقياس في [اسم المشروع]\n\nالمؤشر: [الرقم]\nتاريخ القياس: [التاريخ]\nالمصدر أو طريقة القياس: [الرابط أو ملاحظة القياس]\nالتجربة التالية: [الميزة أو السؤال الهندسي التالي]\n\n#هندسة_برمجيات #بناء_علناً #تطوير_المنتج`
        : `🎉 A measured milestone for [Project Name]\n\nMetric: [Number]\nMeasured on: [Date]\nSource or method: [Link or measurement note]\nNext experiment: [Next Feature or engineering question]\n\n#Engineering #BuildInPublic #ProductDevelopment`,
      cardConfig: { title: isAr ? 'إنجاز جديد' : 'Milestone Reached', metrics: isAr ? '[رقم موثق]' : '[Verified Number]', subtitle: isAr ? 'أضف دليلاً' : 'Add evidence', theme: 'rose' }
    }
  ], [isAr]);

  // Combine static and custom user templates
  const allTemplates = useMemo(() => {
    const userTemplates = posts
      .filter((p) => p.status === 'template')
      .map(p => ({ ...p, isBuiltIn: false }));
    return [...staticTemplates, ...userTemplates];
  }, [posts, staticTemplates]);

  // Filter based on search query and category selector
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchesSearch = t.repoName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.text.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || 
                              (categoryFilter === 'builtin' && t.isBuiltIn) || 
                              (categoryFilter === 'custom' && !t.isBuiltIn);

      return matchesSearch && matchesCategory;
    });
  }, [allTemplates, searchQuery, categoryFilter]);

  // Handle active template selection
  const currentTemplate = useMemo(() => {
    return allTemplates.find(t => t.id === selectedTemplateId) || allTemplates[0] || null;
  }, [allTemplates, selectedTemplateId]);

  // Extract variables (patterns like [Project Name] or [اسم المشروع])
  const extractedPlaceholders = useMemo(() => {
    if (!currentTemplate) return [];
    const regex = /\[([^\]]+)\]/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(currentTemplate.text)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  }, [currentTemplate]);

  // Computed Customized text replacing [Variable] with variables[Variable] or retaining it if blank
  const customizedText = useMemo(() => {
    if (!currentTemplate) return '';
    let updatedText = currentTemplate.text;
    extractedPlaceholders.forEach((placeholder) => {
      const userVal = variables[placeholder];
      if (userVal) {
        // Safe regex escape
        const escaped = placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        updatedText = updatedText.replace(new RegExp(`\\[${escaped}\\]`, 'g'), userVal);
      }
    });
    return updatedText;
  }, [currentTemplate, extractedPlaceholders, variables]);

  const handleCopy = () => {
    navigator.clipboard.writeText(customizedText);
    setCopied(true);
    showToast(custom.copiedToast);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = async () => {
    if (!currentTemplate) return;
    setActionError(null);
    // Call parents method but with customized text applied
    try {
      await handleUseTemplate({
        ...currentTemplate,
        text: customizedText
      });
      // A template becomes a draft; take the user to the real review surface.
      setActiveTab('drafts');
    } catch (error) {
      console.error('Template draft creation failed:', error);
      setActionError(custom.templateActionError);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(custom.deleteTemplateConfirm)) {
      setActionError(null);
      try {
        await handleDeletePost(id);
        if (selectedTemplateId === id) {
          setSelectedTemplateId('static-temp-1');
        }
      } catch (error) {
        console.error('Template deletion failed:', error);
        setActionError(custom.templateActionError);
      }
    }
  };

  return (
    <div className="flex-1 w-full text-center relative flex flex-col items-center justify-start gap-6 min-h-[400px]" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Title block */}
      <div className="w-full text-start flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 p-5 rounded-2xl border border-white/5">
        <div className="flex-1 text-right md:text-start w-full">
          <h2 className="text-xl font-bold text-white mb-1.5 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>{custom.templatesTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">{custom.templatesDesc}</p>
          <p className="text-[10px] text-indigo-300/80 max-w-2xl leading-relaxed">{custom.templateTrustNote}</p>
        </div>
      </div>

      {postsError && (
        <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-start text-sm text-amber-200" role="alert">
          {isAr
            ? 'تعذر تحميل قوالبك المخصصة. القوالب الجاهزة متاحة، ويمكنك إعادة تحميل الصفحة لاحقاً.'
            : isDe
              ? 'Eigene Vorlagen konnten nicht geladen werden. Standardvorlagen bleiben verfügbar; versuche es später erneut.'
              : 'Your custom templates could not be loaded. Built-in templates remain available; try again later.'}
        </div>
      )}
      {actionError && (
        <div className="w-full rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-start text-sm text-rose-200" role="alert">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
        
        {/* Left Column: Template Selection list (span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Search and Category Filter */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
            <div className="relative">
              <Search className={`absolute top-2.5 ${isAr ? 'left-3' : 'right-3'} w-4 h-4 text-slate-500`} />
              <input 
                type="text"
                placeholder={custom.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-950 border border-white/5 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition-colors ${categoryFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
              >
                {custom.filterAll}
              </button>
              <button
                onClick={() => setCategoryFilter('builtin')}
                className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition-colors ${categoryFilter === 'builtin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
              >
                {custom.filterBuiltIn}
              </button>
              <button
                onClick={() => setCategoryFilter('custom')}
                className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition-colors ${categoryFilter === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
              >
                {custom.filterCustom}
              </button>
            </div>
          </div>

          {/* Cards list */}
          <div className="flex flex-col gap-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
            {filteredTemplates.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-white/5 bg-slate-900/20 text-xs text-slate-500">
                <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-55" />
                <p className="font-bold mb-1">{custom.noTemplatesFound}</p>
                {categoryFilter === 'custom' && (
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto mt-2 font-medium">
                    {custom.noCustomTemplatesAdvice}
                  </p>
                )}
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const isSelected = template.id === selectedTemplateId;
                return (
                  <div
                    key={template.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={template.repoName}
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      setVariables({}); // Reset custom inputs when changing template
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedTemplateId(template.id);
                        setVariables({});
                      }
                    }}
                    className={`p-4 rounded-xl border text-start cursor-pointer transition-all duration-300 relative group overflow-hidden
                      ${isSelected 
                        ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-500/40 shadow-md shadow-indigo-500/5' 
                        : 'bg-slate-900/30 border-white/5 hover:border-white/10 hover:bg-slate-900/50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border 
                        ${template.isBuiltIn 
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }
                      `}>
                        {template.isBuiltIn ? custom.builtInBadge : custom.customBadge}
                      </span>

                      {!template.isBuiltIn && (
                        <button
                          onClick={(e) => handleDelete(template.id, e)}
                          aria-label={`${custom.deleteTemplateLabel}: ${template.repoName}`}
                          className="p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-md transition-all shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h4 className="text-xs font-extrabold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">
                      {template.repoName}
                    </h4>
                    
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-medium">
                      {template.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Placeholders + Dynamic Live Preview (span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {currentTemplate ? (
            <div className="flex flex-col gap-6 h-full">
              
              {/* Variable Placeholders custom inputs */}
              {extractedPlaceholders.length > 0 && (
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 text-start">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">{custom.variablesTitle}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {extractedPlaceholders.map((placeholder) => (
                      <div key={placeholder} className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 capitalize">
                          {placeholder}
                        </label>
                        <input
                          type="text"
                          placeholder={custom.variablePlaceholder}
                          value={variables[placeholder] || ''}
                          onChange={(e) => setVariables(prev => ({ ...prev, [placeholder]: e.target.value }))}
                          className="w-full text-xs bg-slate-950 border border-white/5 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview Display Box */}
              <div className="flex-1 bg-slate-900/20 border border-white/5 rounded-2xl p-5 flex flex-col text-start relative shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">{custom.previewTitle}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? custom.textCopied : (isAr ? 'نسخ النص' : 'Copy Text')}</span>
                    </button>
                  </div>
                </div>

                {/* Post Preview Card */}
                <div className="flex-1 bg-slate-950 rounded-xl border border-white/5 p-4.5 font-sans flex flex-col justify-between overflow-y-auto max-h-[350px]">
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md" aria-hidden="true">
                      <Link2 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold text-white tracking-wide">{custom.previewLabel}</span>
                      <span className="block text-[9.5px] text-slate-400 font-bold mt-0.5">{custom.previewSub}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed flex-1 select-text">
                    {customizedText}
                  </p>
                </div>

                {/* Big Action button */}
                <button
                  onClick={handleUse}
                  className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer hover:shadow-indigo-600/20 active:scale-[0.99] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{custom.useTemplateBtn}</span>
                  <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-12 text-slate-500 bg-slate-900/5">
              <Layers className="w-10 h-10 text-slate-600 mb-2 opacity-50" />
              <p className="text-xs font-bold">{custom.noTemplatesFound}</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

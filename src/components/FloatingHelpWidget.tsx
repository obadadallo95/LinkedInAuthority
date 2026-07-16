import React, { useState, useMemo } from 'react';
import { HelpCircle, X, Search, FileText, Send, Shield, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingHelpWidgetProps {
  lang: 'ar' | 'en' | 'de';
}

const faqs = {
  ar: [
    {
      category: "تحليل المستودعات",
      icon: FileText,
      questions: [
        { q: "كيف يعمل تحليل الأكواد؟", a: "يقوم النظام بقراءة الملفات الأساسية في المستودع مثل README وملفات الإعدادات لفهم هيكل المشروع دون تخزين الشفرة المصدرية." },
        { q: "هل تقومون بتخزين الكود الخاص بي؟", a: "لا، نحن لا نقوم بتخزين أي شفرة مصدرية على خوادمنا. المعالجة تتم بشكل لحظي فقط." }
      ]
    },
    {
      category: "النشر على LinkedIn",
      icon: Send,
      questions: [
        { q: "كيف يتم النشر على حسابي؟", a: "نستخدم منصة LinkedIn API الرسمية. لا نحتفظ ببيانات تسجيل الدخول الخاصة بك، بل نستخدم رموز وصول آمنة (OAuth)." },
        { q: "هل يمكنني جدولة المنشورات؟", a: "نعم، يمكنك اختيار وقت محدد في المستقبل وسيقوم النظام بنشره تلقائياً." }
      ]
    },
    {
      category: "الخصوصية والأمان",
      icon: Shield,
      questions: [
        { q: "هل يمكنني حذف بياناتي؟", a: "نعم، يمكنك مسح كافة بياناتك ومنشوراتك وارتباطات حسابك بشكل نهائي من خلال خيار 'حذف الحساب' في صفحة الإعدادات." },
        { q: "هل بياناتي مشفرة؟", a: "نعم، كافة بيانات الاتصال مع قاعدة البيانات مشفرة باستخدام معايير الصناعة." }
      ]
    }
  ],
  en: [
    {
      category: "Repository Analysis",
      icon: FileText,
      questions: [
        { q: "How does code analysis work?", a: "The system reads core files like README and configs to understand project structure without storing your source code." },
        { q: "Do you store my code?", a: "No, we do not store any source code on our servers. Processing is strictly real-time." }
      ]
    },
    {
      category: "LinkedIn Publishing",
      icon: Send,
      questions: [
        { q: "How does posting to my account work?", a: "We use the official LinkedIn API. We don't keep your login credentials; we use secure OAuth access tokens." },
        { q: "Can I schedule posts?", a: "Yes, you can choose a future time and the system will publish it automatically." }
      ]
    },
    {
      category: "Privacy & Security",
      icon: Shield,
      questions: [
        { q: "Can I delete my data?", a: "Yes, you can permanently erase all your data, posts, and account links via the 'Delete Account' option in Settings." },
        { q: "Is my data encrypted?", a: "Yes, all communication with the database is encrypted using industry standards." }
      ]
    }
  ],
  de: [
    {
      category: "Repository Analyse",
      icon: FileText,
      questions: [
        { q: "Wie funktioniert die Code-Analyse?", a: "Das System liest Kerndateien wie README und Konfigurationen, um die Projektstruktur zu verstehen, ohne Ihren Quellcode zu speichern." },
        { q: "Speichern Sie meinen Code?", a: "Nein, wir speichern keinen Quellcode auf unseren Servern. Die Verarbeitung erfolgt streng in Echtzeit." }
      ]
    },
    {
      category: "LinkedIn Veröffentlichung",
      icon: Send,
      questions: [
        { q: "Wie funktioniert das Posten auf meinem Konto?", a: "Wir verwenden die offizielle LinkedIn-API. Wir behalten Ihre Anmeldedaten nicht; wir verwenden sichere OAuth-Zugangstoken." },
        { q: "Kann ich Beiträge planen?", a: "Ja, Sie können eine zukünftige Zeit wählen und das System wird sie automatisch veröffentlichen." }
      ]
    },
    {
      category: "Datenschutz & Sicherheit",
      icon: Shield,
      questions: [
        { q: "Kann ich meine Daten löschen?", a: "Ja, Sie können alle Ihre Daten, Beiträge und Kontoverknüpfungen dauerhaft über die Option 'Konto löschen' in den Einstellungen löschen." },
        { q: "Sind meine Daten verschlüsselt?", a: "Ja, die gesamte Kommunikation mit der Datenbank ist nach Industriestandards verschlüsselt." }
      ]
    }
  ]
};

export const FloatingHelpWidget: React.FC<FloatingHelpWidgetProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const categories = useMemo(() => {
    return faqs[lang] || faqs.en;
  }, [lang]);

  // Filtered FAQs based on category and search query
  const filteredFaqs = useMemo(() => {
    const results: Array<{ category: string; q: string; a: string; sectionIndex: number; questionIndex: number }> = [];
    
    categories.forEach((section, sIdx) => {
      section.questions.forEach((qObj, qIdx) => {
        const matchesCategory = activeCategory === 'all' || section.category === activeCategory;
        const matchesSearch = searchQuery === '' || 
          qObj.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
          qObj.a.toLowerCase().includes(searchQuery.toLowerCase());
          
        if (matchesCategory && matchesSearch) {
          results.push({
            category: section.category,
            q: qObj.q,
            a: qObj.a,
            sectionIndex: sIdx,
            questionIndex: qIdx
          });
        }
      });
    });
    
    return results;
  }, [categories, activeCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIndex(expandedIndex === id ? null : id);
  };

  return (
    <div className={`fixed z-[9999] select-none`} style={{ bottom: '90px', right: isAr ? 'auto' : '24px', left: isAr ? '24px' : 'auto' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Floating Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] max-h-[500px] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
            style={{ transformOrigin: isAr ? 'bottom left' : 'bottom right' }}
          >
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <HelpCircle className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    {isAr ? 'مساعد الدعم الفني' : 'Support Assistant'}
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isAr ? 'إجابات سريعة لمساعدتك' : 'Instant answers to guide you'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content wrapper */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3.5 bg-slate-900/60">
              {/* Search Box */}
              <div className="relative">
                <Search className={`absolute w-3.5 h-3.5 top-1/2 -translate-y-1/2 text-slate-500 ${isAr ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث في الأسئلة الشائعة...' : 'Search answers...'}
                  className={`w-full bg-slate-950 border border-white/5 rounded-xl py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                />
              </div>

              {/* Quick Categories Filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0 no-scrollbar">
                <button
                  onClick={() => { setActiveCategory('all'); setExpandedIndex(null); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border shrink-0 transition-all ${
                    activeCategory === 'all' 
                      ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30' 
                      : 'bg-slate-950 border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'الكل' : 'All'}
                </button>
                {categories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveCategory(cat.category); setExpandedIndex(null); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border shrink-0 transition-all ${
                      activeCategory === cat.category 
                        ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30' 
                        : 'bg-slate-950 border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>

              {/* FAQ Accordions */}
              <div className="space-y-2 flex-1">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    {isAr ? 'لا توجد نتائج مطابقة لبحثك.' : 'No matching results found.'}
                  </div>
                ) : (
                  filteredFaqs.map((faq, index) => {
                    const id = `${faq.sectionIndex}-${faq.questionIndex}`;
                    const isExpanded = expandedIndex === id;
                    
                    return (
                      <div key={index} className="bg-slate-950/60 border border-white/5 rounded-xl overflow-hidden transition-all duration-200">
                        <button
                          onClick={() => toggleExpand(id)}
                          className="w-full p-3 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="text-xs font-bold text-white leading-snug">
                            {faq.q}
                          </span>
                          <ChevronDown 
                            className={`w-3.5 h-3.5 text-indigo-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} 
                          />
                        </button>
                        
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden bg-slate-900/40"
                            >
                              <p className="p-3 text-[11px] text-slate-350 leading-relaxed border-t border-white/5 whitespace-pre-wrap select-text">
                                {faq.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Footer inside FAQ */}
            <div className="p-3 bg-slate-950 border-t border-white/5 text-center text-[10px] text-slate-400">
              {isAr ? 'تحتاج إلى مساعدة إضافية؟ راسل مطور المنصة' : 'Need more help? Contact our support line'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 border border-indigo-400/25 transition-all duration-200 hover:scale-110 active:scale-95 group shrink-0 cursor-pointer relative"
        title={isAr ? 'مركز المساعدة والأسئلة الشائعة' : 'Help & FAQ Center'}
      >
        <span className="absolute inset-0 bg-indigo-500 rounded-full blur-sm opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
        <HelpCircle className="w-6 h-6 group-hover:rotate-6 transition-transform duration-200 relative z-10" />
      </button>
    </div>
  );
};

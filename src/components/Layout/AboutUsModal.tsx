import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Code2, Globe, Rocket, ShieldCheck, Cpu } from 'lucide-react';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en' | 'de';
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose, lang }) => {
  const isAr = lang === 'ar';

  const content = {
    ar: {
      title: "عن المنصة",
      subtitle: "مستقبلك المهني يُصنع هنا",
      storyTitle: "القصة وراء الابتكار",
      storyText: "في عالم تتسارع فيه أدوات الذكاء الاصطناعي، صُمم LinkedIn Authority Engine لمساعدة المبرمجين والمهندسين على تحويل الأدلة الهندسية المهمة إلى مسودات احترافية قابلة للمراجعة، من دون استبدال حكمهم أو نشر المحتوى نيابة عنهم.",
      visionTitle: "رؤيتنا العملية",
      visionText: "نحن لسنا أداة جدولة أو ناشراً آلياً. نبني مساحة عمل تقنية تعتمد على النماذج اللغوية الكبيرة (LLMs) لفهم أدلة مشروعك، ثم تحويل التغييرات الهندسية المهمة إلى مسودة موثّقة تراجعها وتحررها وتنسخها بنفسك.",
      features: [
        { icon: Cpu, title: "تحليل ذكي معماري", desc: "يفهم التقنيات وهيكل المشروع من أدلة محدودة؛ قد تُحفظ مقتطفات مختارة في snapshots لدعم التحليل المتكرر." },
        { icon: Globe, title: "مسودات متعددة اللغات", desc: "يدعم إنشاء مسودات بالإنجليزية والعربية والألمانية، مع ضرورة مراجعة المصطلحات والدقة قبل الاستخدام." },
        { icon: Rocket, title: "مسودات تقنية قابلة للتحرير", desc: "ينشئ مسودات تقنية للمراجعة والنسخ اليدوي؛ النشر المباشر والجدولة غير مطبقين في النسخة التجريبية." },
        { icon: ShieldCheck, title: "حدود الأمان في النسخة التجريبية", desc: "تبقى أسرار Gemini وبيانات اعتماد GitHub الجديدة على الخادم؛ تُحفظ بيانات GitHub مشفّرة في سجل خاص لا يقرأه العميل." }
      ],
      developer: {
        title: "مهندس ومنشئ منتجات ذكاء اصطناعي (AI-First Product Builder)",
        name: "Obada Dallo",
        desc: "خبير في هندسة النظم وتطوير تطبيقات الويب والموبايل والذكاء الاصطناعي من ألمانيا. متخصص في التقنيات الحديثة (React, Firebase, Supabase) ومطور لعدة منصات ناجحة مثل B-Yadina و Sada و Eagle Test.",
        btn: "تواصل مع المطور"
      }
    },
    en: {
      title: "About The Platform",
      subtitle: "A reviewable workspace for technical stories",
      storyTitle: "The Story Behind the Product",
      storyText: "LinkedIn Authority Engine helps engineers turn meaningful, bounded repository evidence into professional drafts they can review, edit, and copy manually. It supports human judgment rather than replacing it or publishing on the user's behalf.",
      visionTitle: "Our Practical Vision",
      visionText: "We are not a scheduler or an auto-publisher. We are building an evidence-backed technical drafting workspace powered by advanced LLMs. It interprets bounded project evidence and meaningful engineering changes, then turns them into editable drafts that you review and copy yourself.",
      features: [
        { icon: Cpu, title: "Architectural AI Analysis", desc: "Understands your stack and project goals from bounded evidence; selected snippets may be retained in snapshots for incremental analysis." },
        { icon: Globe, title: "Multilingual Drafts", desc: "Supports English, Arabic, and German drafts; terminology and accuracy still require human review." },
        { icon: Rocket, title: "Editable Technical Drafts", desc: "Generates technical drafts for manual review and copying; direct publishing and scheduling are not implemented in the beta." },
        { icon: ShieldCheck, title: "Beta Security Boundary", desc: "Gemini secrets stay server-side; new GitHub credentials are encrypted in an Admin-only record and legacy records require migration." }
      ],
      developer: {
        title: "AI-First Product Builder & Architect",
        name: "Obada Dallo",
        desc: "Based in Germany, specializing in high-performance web, mobile, and intelligent systems using React, Firebase, and Supabase. Creator of platforms like B-Yadina, Sada, and Eagle Test.",
        btn: "Contact Developer"
      }
    },
    de: {
      title: "Über die Plattform",
      subtitle: "Ihre berufliche Zukunft wird hier aufgebaut",
      storyTitle: "Die Geschichte hinter der Innovation",
      storyText: "LinkedIn Authority Engine hilft Ingenieuren, wichtige und begrenzte Repository-Nachweise in professionelle Entwürfe zu verwandeln, die sie selbst prüfen, bearbeiten und manuell kopieren können. Das Produkt unterstützt menschliches Urteil und veröffentlicht nicht im Namen des Nutzers.",
      visionTitle: "Unsere praktische Vision",
      visionText: "Wir sind kein Planer und kein Auto-Publisher. Wir bauen einen evidenzbasierten Arbeitsbereich für technische Entwürfe auf Basis fortschrittlicher LLMs. Er interpretiert begrenzte Projektnachweise und wichtige technische Änderungen und erstellt daraus bearbeitbare Entwürfe zur manuellen Prüfung und zum Kopieren.",
      features: [
        { icon: Cpu, title: "Architektonische KI-Analyse", desc: "Versteht Stack und Projektziele anhand begrenzter Evidenz; ausgewählte Ausschnitte können für inkrementelle Analysen in Snapshots verbleiben." },
        { icon: Globe, title: "Mehrsprachige Entwürfe", desc: "Unterstützt Entwürfe auf Englisch, Arabisch und Deutsch; Terminologie und Genauigkeit müssen geprüft werden." },
        { icon: Rocket, title: "Bearbeitbare technische Entwürfe", desc: "Erstellt technische Entwürfe zur manuellen Prüfung und zum Kopieren; direktes Posting und Planung sind in der Beta nicht implementiert." },
        { icon: ShieldCheck, title: "Sicherheitsgrenze der Beta", desc: "Gemini-Schlüssel und neue GitHub-Zugangsdaten bleiben serverseitig; GitHub-Zugangsdaten werden verschlüsselt in einem für den Client nicht lesbaren Datensatz gespeichert." }
      ],
      developer: {
        title: "KI-First Product Builder & Architekt",
        name: "Obada Dallo",
        desc: "Ansässig in Deutschland, spezialisiert auf hochleistungsfähige Web-, Mobil- und intelligente Systeme mit React, Firebase und Supabase. Entwickler von Plattformen wie B-Yadina, Sada und Eagle Test.",
        btn: "Entwickler kontaktieren"
      }
    }
  };

  const current = content[lang];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 md:p-6" dir={isAr ? 'rtl' : 'ltr'}>
          {/* Backdrop with extreme blur and subtle tint */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 transition-all duration-500"
          />

          {/* Modal Container: Full width on mobile, max-w-5xl on desktop, glowing border */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full h-full md:h-auto max-w-5xl md:max-h-[90vh] bg-slate-950/80 backdrop-blur-2xl md:rounded-[2.5rem] md:border border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.15)] flex flex-col overflow-hidden"
          >
            {/* Top Right / Left Close Button */}
            <button 
              onClick={onClose}
              className={`absolute top-6 ${isAr ? 'left-6' : 'right-6'} p-3 rounded-full bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all z-50 backdrop-blur-md border border-white/5`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 w-full h-full">
              
              {/* Premium Hero Section */}
              <div className="relative px-8 pt-16 pb-12 md:px-16 md:pt-20 md:pb-16 text-center md:text-start flex flex-col items-center md:items-start border-b border-white/5">
                {/* Hero Glow Orbs */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-6 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{current.title}</span>
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 leading-tight mb-6"
                >
                  {current.subtitle}
                </motion.h2>
              </div>

              {/* Story & Vision (Side by Side on desktop) */}
              <div className="px-8 md:px-16 py-12 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 relative">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/10 mb-6">
                    <Code2 className="w-6 h-6 text-purple-300" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    {current.storyTitle}
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-base md:text-lg">
                    {current.storyText}
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10 mb-6">
                    <Rocket className="w-6 h-6 text-indigo-300" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    {current.visionTitle}
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-base md:text-lg">
                    {current.visionText}
                  </p>
                </motion.div>
              </div>

              {/* Core Features Grid with Staggered Animation */}
              <div className="px-8 md:px-16 py-12 bg-white/[0.02] border-y border-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                  {current.features.map((feat, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                      key={idx} 
                      className="p-8 rounded-3xl bg-slate-900/50 backdrop-blur-sm border border-white/5 hover:border-indigo-500/50 transition-all duration-300 group hover:shadow-[0_10px_40px_rgba(99,102,241,0.1)] hover:-translate-y-1"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                        <feat.icon className="w-7 h-7 text-indigo-400" />
                      </div>
                      <h4 className="text-xl text-white font-bold mb-3 tracking-tight">{feat.title}</h4>
                      <p className="text-slate-400 text-base leading-relaxed">{feat.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Developer Profile - Premium Glass Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="px-8 md:px-16 py-12"
              >
                <div className="p-8 md:p-10 rounded-[2rem] bg-gradient-to-r from-indigo-900/20 via-slate-900/40 to-purple-900/20 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                  {/* Subtle hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-start gap-8 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                      <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-slate-800 overflow-hidden shrink-0 shadow-2xl">
                        <img src="/obada_portrait.webp" alt={current.developer.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-center">
                      <div className="inline-flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">
                        <Cpu className="w-3.5 h-3.5" />
                        {current.developer.title}
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">{current.developer.name}</h3>
                      <p className="text-slate-400 text-base md:text-lg max-w-xl leading-relaxed">{current.developer.desc}</p>
                    </div>
                  </div>
                  
                  <a 
                    href="https://obadadallo.web.app/contact/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 px-8 py-4 rounded-2xl bg-white text-slate-950 font-black tracking-wide hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95 shrink-0 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center gap-2"
                  >
                    <span>{current.developer.btn}</span>
                    <Globe className="w-5 h-5" />
                  </a>
                </div>
              </motion.div>

              {/* Bottom padding for scroll */}
              <div className="h-12"></div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

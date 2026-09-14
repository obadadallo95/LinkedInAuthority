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
      storyText: "في عالم يسيطر فيه الذكاء الاصطناعي، أدركنا أن المبرمجين والمهندسين يمتلكون مهارات عظيمة وأكواد عبقرية، لكنهم يفتقرون للوقت اللازم لصياغة إنجازاتهم وتحويلها إلى علامة تجارية شخصية قوية (Personal Brand). من هنا وُلد محرك LinkedIn Authority Engine، الأداة الأولى من نوعها التي تسد الفجوة بين الكود البرمجي وصناعة المحتوى الاحترافي.",
      visionTitle: "رؤيتنا الخارقة",
      visionText: "نحن لسنا مجرد 'أداة جدولة'. نحن نبني صانع محتوى تقني متكامل يعتمد على النماذج اللغوية الكبيرة (LLMs). هدفنا هو أن نأخذ كودك المصدري، نحلله بذكاء يشبه مهندس برمجيات خبير (Senior Engineer)، ثم نحوله إلى قصة تقنية تأسر المدراء التنفيذيين وتُبهر المبرمجين، لتتصدر نتائج البحث وتزيد فرصك المهنية.",
      features: [
        { icon: Cpu, title: "تحليل ذكي معماري", desc: "يفهم التقنيات، هيكل المشروع، والهدف البرمجي دون حفظ الشفرة المصدرية." },
        { icon: Globe, title: "تفوق لغوي متعدد", desc: "يكتب بطلاقة باللغات الإنجليزية، العربية، والألمانية مع الحفاظ على النبرة الاحترافية." },
        { icon: Rocket, title: "مسودات تقنية قابلة للتحرير", desc: "ينشئ مسودات تقنية للمراجعة والنسخ اليدوي؛ النشر المباشر والجدولة غير مطبقين في النسخة التجريبية." },
        { icon: ShieldCheck, title: "حدود الأمان في النسخة التجريبية", desc: "تبقى أسرار Gemini على الخادم، بينما تبقى رموز GitHub ضمن إعدادات المستخدم لدعم التدفق الحالي." }
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
      subtitle: "Your Professional Future is Built Here",
      storyTitle: "The Story Behind the Innovation",
      storyText: "In an AI-dominated world, we realized that engineers possess brilliant skills and exceptional code, yet lack the time to articulate their achievements into a powerful Personal Brand. Thus, the LinkedIn Authority Engine was born—the first tool of its kind to bridge the gap between raw code and professional content creation.",
      visionTitle: "Our Groundbreaking Vision",
      visionText: "We are not just a 'scheduler'. We are building an autonomous technical content creator powered by advanced LLMs. Our goal is to ingest your source code, analyze it with the intellect of a Senior Principal Engineer, and transform it into a compelling narrative that captivates C-level executives and awes fellow developers.",
      features: [
        { icon: Cpu, title: "Architectural AI Analysis", desc: "Understands your stack and project goals without ever storing your source code." },
        { icon: Globe, title: "Multilingual Mastery", desc: "Writes flawlessly in English, Arabic, and German while maintaining professional tone." },
        { icon: Rocket, title: "Editable Technical Drafts", desc: "Generates technical drafts for manual review and copying; direct publishing and scheduling are not implemented in the beta." },
        { icon: ShieldCheck, title: "Beta Security Boundary", desc: "Gemini secrets stay server-side; GitHub integration tokens remain in user settings for the current client flow." }
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
      storyText: "In einer von KI dominierten Welt haben wir erkannt, dass Ingenieure über brillante Fähigkeiten und außergewöhnlichen Code verfügen, aber nicht die Zeit haben, ihre Erfolge in eine starke persönliche Marke zu verwandeln. So wurde die LinkedIn Authority Engine geboren – das erste Tool seiner Art, das die Lücke zwischen Rohcode und professioneller Inhaltserstellung schließt.",
      visionTitle: "Unsere bahnbrechende Vision",
      visionText: "Wir sind nicht nur ein 'Planer'. Wir bauen einen autonomen Ersteller technischer Inhalte auf Basis fortschrittlicher LLMs. Unser Ziel ist es, Ihren Quellcode aufzunehmen, ihn mit dem Verstand eines Senior Principal Engineers zu analysieren und ihn in eine fesselnde Erzählung zu verwandeln, die Führungskräfte fasziniert und Entwickler beeindruckt.",
      features: [
        { icon: Cpu, title: "Architektonische KI-Analyse", desc: "Versteht Ihren Stack und Ihre Projektziele, ohne jemals Ihren Quellcode zu speichern." },
        { icon: Globe, title: "Mehrsprachige Meisterschaft", desc: "Schreibt fehlerfrei in Englisch, Arabisch und Deutsch bei Wahrung des professionellen Tons." },
        { icon: Rocket, title: "Bearbeitbare technische Entwürfe", desc: "Erstellt technische Entwürfe zur manuellen Prüfung und zum Kopieren; direktes Posting und Planung sind in der Beta nicht implementiert." },
        { icon: ShieldCheck, title: "Sicherheitsgrenze der Beta", desc: "Gemini-Schlüssel bleiben auf dem Server; GitHub-Integrationstoken bleiben für den aktuellen Client-Ablauf in den Benutzereinstellungen." }
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

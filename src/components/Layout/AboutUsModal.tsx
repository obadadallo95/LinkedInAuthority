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
        { icon: Rocket, title: "نشر مباشر وسلس", desc: "جدولة ذكية ونشر مباشر على LinkedIn باستخدام API رسمي وآمن 100%." },
        { icon: ShieldCheck, title: "أمان بمستوى الحصون", desc: "لا نخزن الكود، تشفير AES-256، وامتثال كامل لقوانين GDPR." }
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
        { icon: Rocket, title: "Seamless Broadcasting", desc: "Smart scheduling and direct publishing to LinkedIn using 100% secure official APIs." },
        { icon: ShieldCheck, title: "Fort-Knox Security", desc: "Zero code storage, AES-256 encryption, and complete GDPR compliance." }
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
        { icon: Rocket, title: "Nahtloses Broadcasting", desc: "Intelligente Planung und direkte Veröffentlichung auf LinkedIn über sichere APIs." },
        { icon: ShieldCheck, title: "Fort-Knox-Sicherheit", desc: "Keine Codespeicherung, AES-256-Verschlüsselung und vollständige DSGVO-Konformität." }
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
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6" dir={isAr ? 'rtl' : 'ltr'}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 transition-all duration-300"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header / Hero Section */}
            <div className="relative p-8 md:p-12 overflow-hidden shrink-0">
              {/* Background Accents */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />
              
              <button 
                onClick={onClose}
                className={`absolute top-6 ${isAr ? 'left-6' : 'right-6'} p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors z-10`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{current.title}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
                  {current.subtitle}
                </h2>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 pt-0 relative z-10">
              
              {/* Vision & Story */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-purple-400" />
                    {current.storyTitle}
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                    {current.storyText}
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-indigo-400" />
                    {current.visionTitle}
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                    {current.visionText}
                  </p>
                </div>
              </div>

              {/* Core Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                {current.features.map((feat, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-950/50 border border-white/5 hover:border-indigo-500/30 transition-colors group">
                    <feat.icon className="w-8 h-8 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="text-white font-bold mb-2">{feat.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Developer / Contact CTA */}
              <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full border-2 border-indigo-400/30 overflow-hidden shrink-0">
                    <img src="/obada_portrait.webp" alt={current.developer.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">{current.developer.title}</div>
                    <h3 className="text-2xl font-black text-white mb-2">{current.developer.name}</h3>
                    <p className="text-slate-300 text-sm">{current.developer.desc}</p>
                  </div>
                </div>
                <a 
                  href="https://obadadallo.web.app/contact/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all hover:scale-105 active:scale-95 shrink-0 shadow-lg shadow-indigo-500/25"
                >
                  {current.developer.btn}
                </a>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

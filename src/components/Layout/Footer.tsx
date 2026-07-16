import React from 'react';
import { Shield, Scale, Terminal, Heart } from 'lucide-react';
import { t } from '../../constants';

interface FooterProps {
  lang: 'ar' | 'en' | 'de';
  onOpenLegal: (tab: 'privacy' | 'terms' | 'developer') => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, onOpenLegal }) => {
  const isAr = lang === 'ar';

  const labels = {
    ar: {
      privacy: "سياسة الخصوصية 🛡️",
      terms: "شروط الاستخدام والملكية IP ⚖️",
      developer: "عبادة دللو 👑"
    },
    en: {
      privacy: "Privacy Policy 🛡️",
      terms: "Terms & IP ⚖️",
      developer: "Obada Dallo 👑"
    },
    de: {
      privacy: "Datenschutz 🛡️",
      terms: "AGB & geistiges Eigentum ⚖️",
      developer: "Obada Dallo 👑"
    }
  };

  const currentLabels = labels[lang] || labels.en;

  return (
    <footer className="min-h-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between px-6 bg-slate-900/40 backdrop-blur-xl z-20 py-2.5 md:py-0 gap-3 md:gap-0">
      
      {/* Live Operational Status Panel */}
      <div className={`flex items-center gap-1.5 text-[9.5px] text-slate-500 font-mono tracking-widest uppercase cursor-default ${isAr ? 'flex-row-reverse' : ''}`}>
        <span>{t[lang].footerLiveStatus}</span>
        <span className="text-emerald-500 font-black animate-pulse flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
          {t[lang].footerOperational}
        </span>
      </div>

      {/* Interactive Policy & Developer Credits Links */}
      <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10.5px] font-bold text-slate-400 ${isAr ? 'flex-row-reverse' : ''}`}>
        
        {/* PRIVACY LINK */}
        <button 
          onClick={() => onOpenLegal('privacy')}
          className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1 hover:underline decoration-indigo-500/50"
        >
          <span>{currentLabels.privacy}</span>
        </button>

        <span className="text-slate-700 select-none">|</span>

        {/* TERMS LINK */}
        <button 
          onClick={() => onOpenLegal('terms')}
          className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1 hover:underline decoration-indigo-500/50"
        >
          <span>{currentLabels.terms}</span>
        </button>

        <span className="text-slate-700 select-none">|</span>

        {/* MASTER DEVELOPER LINK */}
        <button 
          onClick={() => onOpenLegal('developer')}
          className="text-indigo-300 hover:text-purple-400 transition-all cursor-pointer flex items-center gap-1 font-extrabold hover:underline decoration-purple-500/50 relative group"
        >
          <span>{currentLabels.developer}</span>
          <span className="absolute -top-3 -right-3 scale-0 group-hover:scale-100 transition-all duration-200 text-[8px] bg-indigo-600 text-white px-1 py-0.2 rounded font-black animate-bounce font-mono">
            DEV
          </span>
        </button>

      </div>

      {/* General Copyright badge */}
      <div className="text-[10px] text-slate-500 font-medium font-mono flex items-center gap-1 tracking-tight">
        <span>© 2026 Obada Dallo •</span>
        <a 
          href="https://obadadallo.web.app/"
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="hover:text-indigo-400 transition-colors underline font-semibold decoration-indigo-500/30"
        >
          Portfolio
        </a>
      </div>

    </footer>
  );
};


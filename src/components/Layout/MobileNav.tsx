import React from 'react';
import { Home, BarChart3, Settings, Sparkles, FileText, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { t } from '../../constants';

interface MobileNavProps {
  lang: 'ar' | 'en' | 'de';
  activeTab: 'home' | 'posts' | 'analytics' | 'templates' | 'settings';
  setActiveTab: (tab: any) => void;
  onOpenGenerator?: () => void;
  posts?: any[];
}

export const MobileNav: React.FC<MobileNavProps> = ({ lang, activeTab, setActiveTab, onOpenGenerator, posts = [] }) => {
  const isAr = lang === 'ar';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-slate-950/80 backdrop-blur-xl border-t border-white/10 z-40 pb-safe">
      <div className="grid grid-cols-5 h-full w-full items-center justify-items-center relative" dir={isAr ? 'rtl' : 'ltr'}>
        <button 
          onClick={() => setActiveTab('home')}
          className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === 'home' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {activeTab === 'home' && (
             <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-b-full" />
          )}
          <Home className="w-5 h-5 z-10" />
          <span className="text-[10px] font-bold tracking-wider z-10">{isAr ? 'المستودعات' : 'Repos'}</span>
        </button>

        <button 
          onClick={() => setActiveTab('analytics')}
          className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === 'analytics' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {activeTab === 'analytics' && (
             <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-b-full" />
          )}
          <BarChart3 className="w-5 h-5 z-10" />
          <span className="text-[10px] font-bold tracking-wider truncate px-1 max-w-full z-10">{t[lang].tabAnalytics}</span>
        </button>

        <button 
          onClick={() => setActiveTab('posts')}
          className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === 'posts' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {activeTab === 'posts' && (
             <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-b-full" />
          )}
          <FileText className="w-5 h-5 z-10" />
          <span className="text-[10px] font-bold tracking-wider z-10">{isAr ? 'المنشورات' : 'Posts'}</span>
        </button>

        <button 
          onClick={() => setActiveTab('templates')}
          className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === 'templates' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {activeTab === 'templates' && (
             <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-b-full" />
          )}
          <Sparkles className="w-5 h-5 z-10" />
          <span className="text-[10px] font-bold tracking-wider truncate px-1 max-w-full z-10">{lang === 'ar' ? 'القوالب' : lang === 'en' ? 'Templates' : 'Vorlagen'}</span>
        </button>

        
        <button 
          onClick={() => setActiveTab('settings')}
          className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {activeTab === 'settings' && (
             <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-b-full" />
          )}
          <Settings className="w-5 h-5 z-10" />
          <span className="text-[10px] font-bold tracking-wider truncate px-1 max-w-full z-10">{lang === 'ar' ? 'الإعدادات' : lang === 'en' ? 'Settings' : 'Einstellungen'}</span>
        </button>
      </div>
    </div>
  );
};


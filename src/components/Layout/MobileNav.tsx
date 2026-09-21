import React from 'react';
import { Home, Settings, Sparkles, FileText, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { t } from '../../constants';

interface MobileNavProps {
  lang: 'ar' | 'en' | 'de';
  activeTab: 'home' | 'templates' | 'settings' | 'drafts' | 'automations';
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
          aria-label={isAr ? 'المستودعات' : 'Repositories'}
          className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === 'home' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {activeTab === 'home' && (
             <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-b-full" />
          )}
          <Home className="w-5 h-5 z-10" />
          <span className="text-[10px] font-bold tracking-wider z-10">{isAr ? 'المستودعات' : lang === 'de' ? 'Repos' : 'Repos'}</span>
        </button>


        <button 
          onClick={() => setActiveTab('templates')}
          aria-label={lang === 'ar' ? 'القوالب' : lang === 'de' ? 'Vorlagen' : 'Templates'}
          className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === 'templates' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {activeTab === 'templates' && (
             <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-b-full" />
          )}
          <Sparkles className="w-5 h-5 z-10" />
          <span className="text-[10px] font-bold tracking-wider truncate px-1 max-w-full z-10">{lang === 'ar' ? 'القوالب' : lang === 'en' ? 'Templates' : 'Vorlagen'}</span>
        </button>

        <button 
          onClick={() => setActiveTab('automations')}
          aria-label={(t[lang] as any).navAutomations || 'Automations'}
          className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === 'automations' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {activeTab === 'automations' && (
             <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-b-full" />
          )}
          <Activity className="w-5 h-5 z-10" />
          <span className="text-[10px] font-bold tracking-wider truncate px-1 max-w-full z-10">{(t[lang] as any).navAutomations || 'Auto'}</span>
        </button>

        <button 
          onClick={() => setActiveTab('drafts')}
          aria-label={isAr ? 'المسودات' : lang === 'de' ? 'Entwürfe' : 'Drafts'}
          className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === 'drafts' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {activeTab === 'drafts' && (
             <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-b-full" />
          )}
          <FileText className="w-5 h-5 z-10" />
          <span className="text-[10px] font-bold tracking-wider z-10">{isAr ? 'المسودات' : lang === 'de' ? 'Entwürfe' : 'Drafts'}</span>
        </button>        
        
        <button 
          onClick={() => setActiveTab('settings')}
          aria-label={lang === 'ar' ? 'الإعدادات' : lang === 'de' ? 'Einstellungen' : 'Settings'}
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

import React, { useState } from 'react';
import { 
  Home, BarChart3, Settings, Terminal, Sparkles, FileText, HelpCircle
} from 'lucide-react';
import { t } from '../../constants';

interface SidebarProps {
  lang: 'ar' | 'en' | 'de';
  activeTab: 'home' | 'templates' | 'settings' | 'faq';
  setActiveTab: (tab: any) => void;
  posts: any[];
}

export const Sidebar: React.FC<SidebarProps> = ({ lang, activeTab, setActiveTab, posts = [] }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isAr = lang === 'ar';

  const counts = {
    draft: posts.filter(p => p.status === 'draft').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length,
  };

  const menuItems = [
    { id: 'home', label: isAr ? 'المستودعات' : 'Repositories', count: 0, icon: Home },
    { id: 'templates', label: lang === 'ar' ? 'القوالب' : lang === 'en' ? 'Templates' : 'Vorlagen', count: 0, icon: Sparkles },
    { id: 'settings', label: lang === 'ar' ? 'الإعدادات' : lang === 'en' ? 'Settings' : 'Einstellungen', count: 0, icon: Settings }
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`hidden md:flex flex-col bg-slate-900/60 border-white/5 z-30 transition-all duration-300 relative h-full w-16 hover:w-64 backdrop-blur-md shadow-2xl
        ${isAr ? 'border-l' : 'border-r'}
      `}
    >
      {/* Brand logo in Sidebar (Desktop only) */}
      <div className="flex h-20 items-center justify-start px-5 border-b border-white/5 gap-3 shrink-0 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
        </div>
        <span className={`text-sm font-black text-white transition-opacity duration-200 uppercase tracking-tight whitespace-nowrap ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          Authority
        </span>
      </div>

      {/* Menu Options */}
      <nav className="sidebar-nav-container flex-1 flex flex-col justify-start py-4 gap-2 overflow-y-auto custom-scrollbar px-2 w-full">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3.5 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ease-in-out w-full relative group hover:scale-[1.02] active:scale-[0.98]
                ${isActive 
                  ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/5' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                }
                ${isHovered ? 'justify-start' : 'justify-center items-center'}
              `}
            >
              <IconComponent className={`w-5 h-5 shrink-0 transition-all ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] text-indigo-400' : 'group-hover:text-white'}`} />

              <span className={`text-xs font-bold whitespace-nowrap transition-all duration-200 uppercase tracking-widest ${isHovered ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                {item.label}
              </span>

              {item.count > 0 && (
                <div className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 shrink-0 ml-auto border border-indigo-500/30
                  ${isHovered ? 'block' : 'absolute top-1.5 right-1.5'}
                `}>
                  {item.count}
                </div>
              )}

              {/* Precise Sidebar Tooltip (Visible on tablet/desktop when sidebar is not hovered) */}
              {!isHovered && (
                <div className={`hidden group-hover:flex absolute top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-950 border border-white/10 text-white text-[10px] font-bold z-50 shadow-xl whitespace-nowrap pointer-events-none transition-all
                  ${isAr ? 'right-20' : 'left-20'}
                `}>
                  {item.label} {item.count > 0 ? `(${item.count})` : ''}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

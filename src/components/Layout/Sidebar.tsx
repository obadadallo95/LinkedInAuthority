import React, { useState } from 'react';
import { 
  Home, Settings, Sparkles, FileText, Activity
} from 'lucide-react';
import { t } from '../../constants';

interface SidebarProps {
  lang: 'ar' | 'en' | 'de';
  activeTab: 'home' | 'templates' | 'settings' | 'faq' | 'drafts' | 'automations';
  setActiveTab: (tab: any) => void;
  posts: any[];
}

export const Sidebar: React.FC<SidebarProps> = ({ lang, activeTab, setActiveTab, posts = [] }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isAr = lang === 'ar';

  const menuItems = [
    { id: 'home', label: lang === 'ar' ? 'المستودعات' : lang === 'de' ? 'Repositories' : 'Repositories', icon: Home },
    { id: 'drafts', label: lang === 'ar' ? 'المسودات' : lang === 'de' ? 'Entwürfe' : 'Drafts', icon: FileText },
    { id: 'templates', label: lang === 'ar' ? 'القوالب' : lang === 'de' ? 'Vorlagen' : 'Templates', icon: Sparkles },
    { id: 'automations', label: (t[lang] as any).navAutomations || 'Automations', count: 0, icon: Activity },
    { id: 'settings', label: lang === 'ar' ? 'الإعدادات' : lang === 'de' ? 'Einstellungen' : 'Settings', icon: Settings }
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`hidden md:flex flex-col bg-slate-950/50 backdrop-blur-md border-white/5 z-30 transition-all duration-300 relative h-full w-16 hover:w-56
        ${isAr ? 'border-l' : 'border-r'}
      `}
    >
      {/* Menu Options */}
      <nav className="sidebar-nav-container flex-1 flex flex-col justify-start py-6 gap-2 overflow-y-auto custom-scrollbar px-2 w-full">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
              className={`flex items-center gap-3.5 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out w-full relative group hover:scale-[1.02] active:scale-[0.98]
                ${isActive 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                }
                ${isHovered ? 'justify-start' : 'justify-center items-center'}
              `}
            >
              <IconComponent className={`w-5 h-5 shrink-0 transition-all ${isActive ? 'scale-110 text-indigo-400' : 'group-hover:text-white'}`} />

              <span className={`text-xs font-bold whitespace-nowrap transition-all duration-200 tracking-wide ${isHovered ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                {item.label}
              </span>

              {'count' in item && item.count > 0 && (
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
                  {item.label} {'count' in item && item.count > 0 ? `(${item.count})` : ''}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

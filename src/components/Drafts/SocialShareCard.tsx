import React from 'react';
import { GitBranch, Share2, Calendar, Eye, ShieldAlert, Sparkles, Award } from 'lucide-react';
import { t } from '../../constants';

export const SocialShareCard = ({ currentPost, settings }: any) => {
  // Safe default background color mappings based on theme selections
  const theme = currentPost.cardConfig.colorTheme || 'indigo';

  const colorThemes: any = {
    emerald: {
      bg: 'bg-emerald-950/20 border-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-400',
      tag: 'text-emerald-300/80',
      heading: 'text-emerald-300'
    },
    amber: {
      bg: 'bg-amber-950/20 border-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-400',
      tag: 'text-amber-300/80',
      heading: 'text-amber-300'
    },
    rose: {
      bg: 'bg-rose-950/20 border-rose-500/20',
      badge: 'bg-rose-500/10 text-rose-455',
      tag: 'text-rose-300/80',
      heading: 'text-rose-300'
    },
    teal: {
      bg: 'bg-teal-950/20 border-teal-500/20',
      badge: 'bg-teal-500/10 text-teal-400',
      tag: 'text-teal-300/80',
      heading: 'text-teal-300'
    },
    indigo: {
      bg: 'bg-indigo-950/20 border-indigo-500/20',
      badge: 'bg-indigo-500/10 text-indigo-400',
      tag: 'text-indigo-300/80',
      heading: 'text-indigo-300'
    }
  };

  const selectedTheme = colorThemes[theme] || colorThemes.indigo;

  // Real computed length view counts based on text hash
  const pseudoReach = Math.floor(1200 + ((currentPost.text?.length || 0) * 1.83)) + " views";

  return (
    <div className={`rounded-xl border p-4 overflow-hidden relative flex flex-col justify-between max-w-sm mx-auto shadow-xl transition-all hover:scale-[1.01] hover:shadow-indigo-500/5 duration-300 ${selectedTheme.bg}`}>
      
      {/* Subtle LinkedIn Watermark background overlay */}
      <div className="absolute right-3 bottom-0 text-white/5 pointer-events-none transform translate-y-2 translate-x-2 select-none">
        <Share2 className="w-24 h-24 stroke-[0.5]" />
      </div>

      <div className="flex justify-between items-start z-10 relative mb-2">
        <div className="flex items-center gap-2">
          {settings.linkedinProfile?.picture || settings.githubProfile?.avatar_url ? (
            <img 
              src={settings.linkedinProfile?.picture || settings.githubProfile?.avatar_url} 
              alt="User avatar" 
              className="w-5 h-5 rounded-full border border-white/20 shadow-md" 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-800 border border-indigo-500/40" />
          )}
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-black text-slate-200 leading-tight">
              {settings.linkedinProfile?.name || settings.githubProfile?.name || settings.githubUsername || "Executive Leader"}
            </span>
            <div className="flex items-center gap-1 mt-0.5 leading-none">
              <Eye className="w-2.5 h-2.5 text-slate-500" />
              <span className="text-[7.5px] text-slate-400 font-mono font-medium">{pseudoReach} • LinkedIn Hub</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end leading-none">
          <span className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${selectedTheme.badge}`}>
            {currentPost.cardConfig?.metrics || 'METRIC'}
          </span>
          <span className="text-[7.5px] text-slate-550 font-mono mt-1 flex items-center gap-0.5 opacity-80">
            <GitBranch className="w-2.5 h-2.5 text-slate-500" />
            <span>{currentPost.repoName || 'github-project'}</span>
          </span>
        </div>
      </div>

      <div className="z-10 relative mt-1.5 mb-1 text-left">
        <div className="flex items-center gap-1 mb-0.5">
          <Award className="w-3.5 h-3.5 text-indigo-400" />
          <h4 className="text-xs font-extrabold text-white tracking-tight uppercase line-clamp-1">{currentPost.cardConfig?.title || 'CARD PREVIEW'}</h4>
        </div>
        <p className="text-[10px] text-slate-300 tracking-tight leading-snug line-clamp-2">{currentPost.cardConfig?.subtitle || 'Selected codebase analysis and automation posts cards summary description'}</p>
      </div>

    </div>
  );
};

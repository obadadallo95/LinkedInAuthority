import React from 'react';
import { t } from '../constants';
import { FileText, Calendar, CheckSquare, Sparkles } from 'lucide-react';

type ListProps = { lang: 'ar'|'en'|'de'; posts: any[]; activeId: string; onSelect: (post: any) => void };

export const DraftList = ({ lang, posts, activeId, onSelect }: ListProps) => {
  const isAr = lang === 'ar';
  const drafts = posts.filter(p => !['scheduled','published'].includes(p.status));

  return (
    <div className="space-y-2.5">
      {drafts.length === 0 && (
        <div className="text-center text-xs p-6 bg-slate-900/40 rounded-2xl border border-white/5 text-slate-500">
          {t[lang].noPostsInTab}
        </div>
      )}
      {drafts.map(post => (
        <button 
          key={post.id} 
          onClick={() => onSelect(post)} 
          className={`w-full p-4 rounded-2xl border transition-all duration-250 flex flex-col gap-2 cursor-pointer text-left transform active:scale-[0.99]
            ${activeId === post.id 
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-550/5' 
              : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/70'
            }
          `}
          dir="auto"
        >
          <div className="flex justify-between items-center w-full">
            <span className="text-xs font-black text-slate-200 uppercase tracking-tight truncate max-w-[150px]">{post.repoName}</span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
              ${post.status === 'failed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-850 text-slate-400 border border-white/5'}
            `}>
              {post.status === 'failed' ? t[lang].statusLabelFailed : t[lang].statusLabelDraft}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed">{post.text}</p>
        </button>
      ))}
    </div>
  );
};

export const ScheduledList = ({ lang, posts, activeId, onSelect }: ListProps) => {
  const isAr = lang === 'ar';
  const scheduled = posts.filter(p => p.status === 'scheduled');

  return (
    <div className="space-y-2.5">
      {scheduled.length === 0 && (
        <div className="text-center text-xs p-6 bg-slate-900/40 rounded-2xl border border-white/5 text-slate-500">
          {t[lang].noPostsInTab}
        </div>
      )}
      {scheduled.map(post => {
         const dateObj = post.scheduledAt ? new Date(post.scheduledAt) : null;
         return (
          <button 
            key={post.id} 
            onClick={() => onSelect(post)} 
            className={`w-full p-4 rounded-2xl border transition-all duration-250 flex flex-col gap-2 cursor-pointer text-left transform active:scale-[0.99]
              ${activeId === post.id 
                ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-550/5' 
                : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/70'
              }
            `}
            dir="auto"
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-xs font-black text-slate-205 uppercase tracking-tight truncate max-w-[150px]">{post.repoName}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-550/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                {t[lang].statusLabelScheduled}
              </span>
            </div>
            {dateObj && (
              <span className="text-[9.5px] font-bold text-amber-200/80 bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10 self-start">
                ⏱ {dateObj.toLocaleString()}
              </span>
            )}
            <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed">{post.text}</p>
          </button>
         );
      })}
    </div>
  );
};

export const PublishedList = ({ lang, posts, activeId, onSelect }: ListProps) => {
  const isAr = lang === 'ar';
  const published = posts.filter(p => p.status === 'published');

  return (
    <div className="space-y-2.5">
      {published.length === 0 && (
        <div className="text-center text-xs p-6 bg-slate-900/40 rounded-2xl border border-white/5 text-slate-500">
          {t[lang].noPostsInTab}
        </div>
      )}
      {published.map(post => {
         const dateObj = post.publishTime ? new Date(post.publishTime) : null;
         return (
          <button 
            key={post.id} 
            onClick={() => onSelect(post)} 
            className={`w-full p-4 rounded-2xl border transition-all duration-250 flex flex-col gap-2 cursor-pointer text-left transform active:scale-[0.99]
              ${activeId === post.id 
                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-555/5' 
                : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/70'
              }
            `}
            dir="auto"
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-xs font-black text-slate-205 uppercase tracking-tight truncate max-w-[150px]">{post.repoName}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                {t[lang].statusLabelLive}
              </span>
            </div>
            {dateObj && (
              <span className="text-[9.5px] font-bold text-emerald-300/80 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10 self-start">
                ✓ {dateObj.toLocaleString()}
              </span>
            )}
            <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed">{post.text}</p>
          </button>
         );
      })}
    </div>
  );
};

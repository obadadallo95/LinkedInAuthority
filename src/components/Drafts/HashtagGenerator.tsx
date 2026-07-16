import React from 'react';
import { Sparkles, Hash } from 'lucide-react';
import { t } from '../../constants';

export const HashtagGenerator = ({ 
  lang, currentPost, generatingHashtagsState, generateHashtags, suggestedHashtags, appendHashtags, appendToAllDrafts 
}: any) => {
  const isAr = lang === 'ar';
  return (
    <div className="bg-slate-800 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <button 
          onClick={() => generateHashtags(currentPost.text, lang)}
          disabled={generatingHashtagsState || !currentPost?.text || currentPost.text.length < 20}
          className="text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-750 text-white px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md transform active:scale-95"
        >
          {generatingHashtagsState ? (
            <span className="animate-pulse">{t[lang].generatingHashtags}</span>
          ) : (
            <><Sparkles className="w-4 h-4 text-amber-300 animate-spin" /> {t[lang].generateHashtagsBtn}</>
          )}
        </button>
        
        {suggestedHashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => appendHashtags(suggestedHashtags)} 
              className="text-[10px] font-bold bg-slate-900 hover:bg-slate-950 text-white px-3 py-1.5 flex items-center rounded-xl transition-all border border-white/5 cursor-pointer"
            >
              {t[lang].appendAllHashtags}
            </button>
            <button 
              onClick={() => appendToAllDrafts(suggestedHashtags)} 
              className="text-[10px] font-bold bg-indigo-600/10 hover:bg-indigo-600/25 text-indigo-300 px-3 py-1.5 flex items-center rounded-xl transition-all border border-indigo-500/20 cursor-pointer"
            >
              {t[lang].appendToAllDrafts}
            </button>
          </div>
        )}
      </div>

      {suggestedHashtags.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{isAr ? 'الهاشتاغات المقترحة' : 'Suggested Tags'}</p>
          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900/60 rounded-xl border border-white/5">
            {suggestedHashtags.map((tag:string, i:number) => (
               <button
                  key={i}
                  onClick={() => appendHashtags([tag])}
                  className="text-[10px] font-mono font-semibold bg-slate-950 border border-white/5 hover:border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  title={t[lang].addHashtagTooltip}
               >
                 {tag}
               </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-slate-500 italic">
          {isAr ? 'اكتب ٢٠ حرفًا على الأقل لتوليد هاشتاقات ترويجيّة ذكيّة.' : 'Write 20+ characters to auto-generate context tags.'}
        </p>
      )}
    </div>
  );
};

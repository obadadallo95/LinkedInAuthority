import React from 'react';
import { motion } from 'framer-motion';
import { t } from '../locales';
import { Sparkles, Rocket, BrainCircuit, TrendingUp, Target, RadioTower, ShieldAlert } from 'lucide-react';

interface IntentCardsProps {
  selectedIntent: string;
  onSelectIntent: (intent: string) => void;
  lang: 'en' | 'ar' | 'de';
}

export const IntentCards = ({ selectedIntent, onSelectIntent, lang }: IntentCardsProps) => {
  const T = t[lang] || t['ar'];

  const intentsList = [
    { id: 'auto', title: T.demoIntentAuto, icon: Sparkles },
    { id: 'project', title: T.demoIntentAnnouncement, icon: Rocket },
    { id: 'technical_decision', title: T.demoIntentDecision, icon: BrainCircuit },
    { id: 'challenge_lesson', title: T.demoIntentLesson, icon: TrendingUp },
    { id: 'progress_update', title: T.demoIntentUpdate, icon: Target },
    { id: 'feedback', title: T.demoIntentFeedback, icon: RadioTower },
    { id: 'problem', title: T.demoIntentProblem, icon: ShieldAlert },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {intentsList.map((intent) => {
        const isSelected = selectedIntent === intent.id;
        const Icon = intent.icon;

        return (
          <motion.div
            key={intent.id}
            onClick={() => onSelectIntent(intent.id)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative cursor-pointer p-4 rounded-xl border transition-all duration-300
              flex flex-col items-center justify-center gap-3 text-center min-h-[120px] overflow-hidden group
              ${isSelected 
                ? 'bg-[#0a0a0a] border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                : 'bg-[#111] border-white/5 hover:border-white/15 hover:bg-[#161616]'}
            `}
          >
            {/* Subtle highlight gradient on hover for non-selected */}
            {!isSelected && (
               <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            )}

            {/* Glowing background for selected */}
            {isSelected && (
              <div className="absolute inset-0 bg-indigo-500/10 blur-[20px] opacity-60 pointer-events-none" />
            )}

            <div className={`
              relative z-10 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300
              ${isSelected ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-900 border border-white/5 text-slate-400 group-hover:text-slate-300'}
            `}>
              <Icon size={18} />
            </div>
            
            <span className={`relative z-10 text-xs font-semibold leading-relaxed tracking-wide ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
              {intent.title}
            </span>
            
            {/* Selection indicator line */}
            {isSelected && (
              <motion.div 
                layoutId="active-intent-line"
                className="absolute top-0 inset-x-0 h-[2px] bg-indigo-500"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

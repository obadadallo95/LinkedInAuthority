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
    { id: 'auto', title: T.demoIntentAuto, icon: Sparkles, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', glow: 'shadow-[0_0_15px_rgba(232,121,249,0.2)]' },
    { id: 'project', title: T.demoIntentAnnouncement, icon: Rocket, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', glow: 'shadow-[0_0_15px_rgba(56,189,248,0.2)]' },
    { id: 'technical_decision', title: T.demoIntentDecision, icon: BrainCircuit, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', glow: 'shadow-[0_0_15px_rgba(129,140,248,0.2)]' },
    { id: 'challenge_lesson', title: T.demoIntentLesson, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.2)]' },
    { id: 'progress_update', title: T.demoIntentUpdate, icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.2)]' },
    { id: 'feedback', title: T.demoIntentFeedback, icon: RadioTower, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.2)]' },
    { id: 'problem', title: T.demoIntentProblem, icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', glow: 'shadow-[0_0_15px_rgba(251,113,133,0.2)]' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {intentsList.map((intent) => {
        const isSelected = selectedIntent === intent.id;
        const Icon = intent.icon;

        return (
          <motion.div
            key={intent.id}
            onClick={() => onSelectIntent(intent.id)}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative cursor-pointer p-5 rounded-2xl border transition-all duration-300
              flex flex-col items-center justify-center gap-4 text-center min-h-[140px] overflow-hidden
              ${isSelected 
                ? `bg-slate-900 border-white/20 ${intent.glow}` 
                : 'bg-slate-950/50 border-white/5 hover:border-white/10 hover:bg-slate-900/80'}
            `}
          >
            {/* Background Glow when selected */}
            {isSelected && (
              <div className={`absolute inset-0 ${intent.bg} blur-2xl opacity-50 pointer-events-none`} />
            )}

            <div className={`relative z-10 p-3.5 rounded-xl transition-all duration-300 ${isSelected ? intent.bg + ' ' + intent.border + ' border' : 'bg-slate-900 border border-white/5'}`}>
              <motion.div
                animate={isSelected ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                transition={{ repeat: isSelected ? Infinity : 0, duration: 3, ease: 'easeInOut' }}
              >
                <Icon size={24} className={`${isSelected ? intent.color : 'text-slate-400'}`} />
              </motion.div>
            </div>
            
            <span className={`relative z-10 text-xs font-bold leading-snug ${isSelected ? 'text-white' : 'text-slate-400'}`}>
              {intent.title}
            </span>
            
            {/* Selection indicator */}
            {isSelected && (
              <motion.div 
                layoutId="active-intent-border"
                className="absolute inset-0 rounded-2xl border-2 border-indigo-500/50 pointer-events-none"
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

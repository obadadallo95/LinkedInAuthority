import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Database, BrainCircuit, PenTool, CheckCircle, Search, Server, ShieldCheck, Zap } from 'lucide-react';

interface DeepScanLoaderProps {
  repoName: string;
  isAr: boolean;
}

const STEPS = [
  { id: 'fetch', icon: Database, labelEn: 'Cloning Repository Context...', labelAr: 'جاري استنساخ سياق المستودع...', time: 2000 },
  { id: 'commits', icon: Terminal, labelEn: 'Analyzing Commit History...', labelAr: 'جاري تحليل تاريخ التعديلات (Commits)...', time: 3000 },
  { id: 'prs', icon: Server, labelEn: 'Scanning Pull Requests & Issues...', labelAr: 'جاري فحص طلبات الدمج (PRs)...', time: 3000 },
  { id: 'ai', icon: BrainCircuit, labelEn: 'Synthesizing Technical Decisions (AI Phase 1)...', labelAr: 'جاري معالجة القرارات التقنية (الذكاء الاصطناعي 1)...', time: 4000 },
  { id: 'drafting', icon: PenTool, labelEn: 'Drafting Professional Post (AI Phase 2)...', labelAr: 'جاري صياغة المنشور الاحترافي (الذكاء الاصطناعي 2)...', time: 5000 },
];

export const DeepScanLoader: React.FC<DeepScanLoaderProps> = ({ repoName, isAr }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const runSteps = async () => {
      for (let i = 0; i < STEPS.length - 1; i++) {
        await new Promise(resolve => {
          timeout = setTimeout(resolve, STEPS[i].time);
        });
        setCurrentStep(prev => prev + 1);
      }
    };
    
    runSteps();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto my-12 bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Search className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              {isAr ? 'الفحص العميق' : 'Deep Scan'}
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                PRO
              </span>
            </h3>
            <p className="text-slate-400 text-sm font-mono mt-0.5">{repoName}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-slate-700" />
          <div className="w-3 h-3 rounded-full bg-slate-700" />
          <div className="w-3 h-3 rounded-full bg-slate-700" />
        </div>
      </div>

      {/* Body */}
      <div className="p-6 font-mono text-sm relative overflow-hidden min-h-[300px]">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-grid-slate-800/[0.04] bg-[length:16px_16px]"></div>
        
        <div className="space-y-6 relative z-10">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isPast = index < currentStep;
            const Icon = step.icon;

            return (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, x: isAr ? 20 : -20 }}
                animate={{ 
                  opacity: isActive || isPast ? 1 : 0.3, 
                  x: 0,
                  scale: isActive ? 1.02 : 1
                }}
                className={`flex items-center gap-4 ${isActive ? 'text-white' : isPast ? 'text-slate-400' : 'text-slate-600'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors duration-500 ${
                  isActive 
                    ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                    : isPast 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-slate-800 border-slate-700'
                }`}>
                  {isPast ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="w-5 h-5 text-indigo-400" />
                    </motion.div>
                  ) : (
                    <Icon className="w-5 h-5 opacity-50" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-medium transition-colors duration-500 ${isActive ? 'text-indigo-200' : ''}`}>
                      {isAr ? step.labelAr : step.labelEn}
                    </span>
                    {isActive && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-indigo-400 text-xs"
                      >
                        {isAr ? 'جاري...' : 'Processing...'}
                      </motion.span>
                    )}
                    {isPast && <span className="text-emerald-400 text-xs">Done</span>}
                  </div>
                  
                  {/* Progress bar for active step */}
                  {isActive && (
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: step.time / 1000, ease: "linear" }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

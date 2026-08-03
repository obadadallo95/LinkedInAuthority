import React from 'react';
import { motion } from 'framer-motion';
import { FileCode2 } from 'lucide-react';

const LinkedinIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export const TransformationLoader = ({ label }: { label: string }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full py-12">
      <div className="flex items-center gap-4 relative w-full max-w-sm justify-between px-8">
        
        {/* Connection Line & Data Stream */}
        <div className="absolute top-1/2 left-1/4 right-1/4 h-[1px] bg-slate-800 -translate-y-1/2 z-0 overflow-hidden">
          <motion.div
            className="w-24 h-[2px] absolute top-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 1), transparent)',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.8), 0 0 20px rgba(99, 102, 241, 0.5)'
            }}
            animate={{ left: ['-100%', '200%'] }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "linear",
            }}
          />
        </div>

        {/* Source Node (Code/GitHub) */}
        <motion.div 
          className="relative z-10 w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          animate={{ borderColor: ['rgba(30,41,59,1)', 'rgba(99,102,241,0.5)', 'rgba(30,41,59,1)'] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          {/* Subtle inner grid/code lines */}
          <div className="absolute inset-0 opacity-20 flex flex-col gap-1.5 p-3">
            <motion.div 
              className="h-1 bg-indigo-400 rounded w-full"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.1 }}
            />
            <motion.div 
              className="h-1 bg-indigo-400 rounded w-3/4"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
            />
            <motion.div 
              className="h-1 bg-indigo-400 rounded w-5/6"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
            />
            <motion.div 
              className="h-1 bg-indigo-400 rounded w-1/2"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.7 }}
            />
          </div>
          
          <div className="relative z-10 p-3 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/5">
            <FileCode2 size={24} className="text-indigo-400" />
          </div>
        </motion.div>

        {/* Target Node (LinkedIn Post) */}
        <motion.div 
          className="relative z-10 w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          animate={{ borderColor: ['rgba(30,41,59,1)', 'rgba(56,189,248,0.5)', 'rgba(30,41,59,1)'] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.75 }}
        >
          {/* Subtle inner card shape */}
          <div className="absolute inset-0 opacity-20 flex flex-col p-3 gap-2">
            <div className="flex gap-2 items-center">
              <motion.div 
                className="w-4 h-4 rounded-full bg-sky-400"
                animate={{ scale: [0.8, 1, 0.8] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
              <div className="flex-1 space-y-1">
                <div className="h-1 bg-sky-400 rounded w-full" />
                <div className="h-1 bg-sky-400 rounded w-2/3" />
              </div>
            </div>
            <div className="h-full w-full bg-sky-400/20 rounded border border-sky-400/30 mt-1" />
          </div>
          
          <div className="relative z-10 p-3 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/5">
            <LinkedinIcon size={24} className="text-sky-400" />
          </div>
        </motion.div>
      </div>

      {/* Label with shimmering effect */}
      <motion.div 
        className="mt-8 text-sm font-semibold tracking-wide text-transparent bg-clip-text"
        style={{
          backgroundImage: 'linear-gradient(90deg, #94a3b8 0%, #ffffff 50%, #94a3b8 100%)',
          backgroundSize: '200% auto',
        }}
        animate={{ backgroundPosition: ['200% center', '-200% center'] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
      >
        {label}
      </motion.div>
    </div>
  );
};

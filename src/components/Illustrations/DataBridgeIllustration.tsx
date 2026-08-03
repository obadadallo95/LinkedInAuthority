import React from 'react';
import { motion } from 'framer-motion';

export const DataBridgeIllustration = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`relative w-48 h-48 flex items-center justify-center mx-auto ${className}`}>
      {/* Background Glow */}
      <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] rounded-full pointer-events-none" />
      
      <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        {/* Left Node */}
        <motion.rect
          x="20"
          y="70"
          width="40"
          height="60"
          rx="12"
          fill="#0F172A"
          stroke="#4F46E5"
          strokeWidth="2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {/* Left Node Inner Detail */}
        <motion.rect
          x="28"
          y="78"
          width="24"
          height="4"
          rx="2"
          fill="#334155"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        />
        <motion.rect
          x="28"
          y="88"
          width="16"
          height="4"
          rx="2"
          fill="#334155"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        />
        
        {/* Right Node */}
        <motion.rect
          x="140"
          y="70"
          width="40"
          height="60"
          rx="12"
          fill="#0F172A"
          stroke="#8B5CF6"
          strokeWidth="2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
        {/* Right Node Inner Detail */}
        <motion.circle
          cx="160"
          cy="100"
          r="8"
          fill="none"
          stroke="#475569"
          strokeWidth="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        />

        {/* Bridge Paths */}
        <path
          d="M60 90 L140 90"
          stroke="#1E293B"
          strokeWidth="2"
        />
        <path
          d="M60 110 L140 110"
          stroke="#1E293B"
          strokeWidth="2"
        />

        {/* Moving Particles Top */}
        <motion.circle
          r="4"
          fill="#818CF8"
          initial={{ x: 60, y: 90, opacity: 0 }}
          animate={{ x: 140, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        {/* Moving Particles Bottom */}
        <motion.circle
          r="4"
          fill="#A78BFA"
          initial={{ x: 140, y: 110, opacity: 0 }}
          animate={{ x: 60, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
        />
        
        {/* Central Hub/Orbit */}
        <motion.circle
          cx="100"
          cy="100"
          r="28"
          fill="#0F172A"
          stroke="#1E293B"
          strokeWidth="1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
        />
        <motion.circle
          cx="100"
          cy="100"
          r="34"
          fill="none"
          stroke="#6366F1"
          strokeWidth="1"
          strokeDasharray="4 8"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M92 100 L108 100 M100 92 L100 108"
          stroke="#818CF8"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>
    </div>
  );
};

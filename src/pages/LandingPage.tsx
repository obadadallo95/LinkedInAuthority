import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Share2, ArrowRight, Bot, Code2, Globe } from 'lucide-react';

const GithubIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/>
  </svg>
);
import { useAuth } from '../application/AuthContext';
import { t } from '../locales';

export const LandingPage = ({ lang, onToggleLang }: { lang: 'en'|'ar'|'de', onToggleLang: () => void }) => {
  const { signInWithGoogle } = useAuth();

  const handleStart = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
    }
  };

  const isRtl = lang === 'ar';
  const T = t[lang] || t['ar'];

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 overflow-hidden ${isRtl ? 'font-arabic' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
            <Bot size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">{T.appTitle}</span>
        </div>
        <button onClick={onToggleLang} className="text-sm text-slate-400 hover:text-white transition-colors">
          {lang === 'ar' ? 'English' : 'العربية'}
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 max-w-4xl mx-auto leading-tight">
            {T.landingHeroTitle}
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {T.landingHeroDesc}
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-900 font-semibold rounded-full overflow-hidden transition-all hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              {T.landingCta}
              <ArrowRight size={20} className={`transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        </motion.div>

        {/* Bento Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto text-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 relative overflow-hidden rounded-3xl bg-slate-900/50 border border-white/5 p-8 backdrop-blur-sm hover:bg-slate-900/80 transition-colors"
          >
            <div className="bg-indigo-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30">
              <GithubIcon className="text-indigo-400" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{T.landingBento1Title}</h3>
            <p className="text-slate-400">{T.landingBento1Desc}</p>
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <Code2 size={200} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-3xl bg-slate-900/50 border border-white/5 p-8 backdrop-blur-sm hover:bg-slate-900/80 transition-colors"
          >
            <div className="bg-emerald-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
              <Zap className="text-emerald-400" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{T.landingBento2Title}</h3>
            <p className="text-slate-400">{T.landingBento2Desc}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="md:col-span-3 relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-white/10 p-8 md:p-12 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between"
          >
            <div className="max-w-xl z-10">
              <div className="bg-blue-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
                <Share2 className="text-blue-400" size={24} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">{T.landingBento3Title}</h3>
              <p className="text-lg text-slate-300">{T.landingBento3Desc}</p>
            </div>
            <div className="mt-8 md:mt-0 relative z-10">
               <Globe size={120} className="text-blue-400/20 animate-[spin_20s_linear_infinite]" />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Bot size={16} />
            <span>© 2026 {T.appTitle}. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Developers</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

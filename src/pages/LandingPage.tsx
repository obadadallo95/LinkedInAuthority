import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Bot, Globe, Check, Sparkles, Lock, ArrowLeft,
  User, RefreshCw, Zap, Target, AlertTriangle, BrainCircuit, ShieldCheck, Workflow, Activity
} from 'lucide-react';
import { useAuth } from '../application/AuthContext';
import { t } from '../locales';
import { trackEvent } from '../utils/analytics';
import { LegalModal } from '../components/Layout/LegalModal';
import { AboutUsModal } from '../components/Layout/AboutUsModal';
import { TransformationLoader } from '../components/TransformationLoader';
import { IntentCards } from '../components/IntentCards';

const GithubIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/>
  </svg>
);

const LinkedinIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

type DemoPhase = 'idle' | 'analyzing' | 'needs_context' | 'angles' | 'adaptive_question' | 'generating' | 'result';

export const LandingPage = ({ lang, onToggleLang }: { lang: 'en' | 'ar' | 'de', onToggleLang: (target?: 'en' | 'ar' | 'de') => void }) => {
  const { signInWithGoogle, signInWithGithub } = useAuth();
  const [view, setView] = useState<'landing' | 'login'>('landing');
  
  const [demoStep, setDemoStep] = useState<1 | 2 | 3>(1);
  const [targetAudience, setTargetAudience] = useState('Software Engineers');
  const [demoUrl, setDemoUrl] = useState('');
  const [phase, setPhase] = useState<DemoPhase>('idle');
  
  const [selectedMainIntent, setSelectedMainIntent] = useState('auto');
  
  const [demoResult, setDemoResult] = useState<any>(null);
  const [demoError, setDemoError] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const trackEditTimeout = useRef<any>(null);

  // Modals
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms' | 'developer'>('privacy');

  const openLegalTab = (tab: 'privacy' | 'terms' | 'developer') => {
    setLegalTab(tab);
    setIsLegalOpen(true);
  };

  const isRtl = lang === 'ar';
  const T = t[lang] || t['ar'];

  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === 'landing') {
      trackEvent('landing_view');
    }
  }, [view]);

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth' });
    trackEvent('public_demo_started');
  };

  const handlePostChange = (newText: string) => {
    if (demoResult) {
      setDemoResult({ ...demoResult, post: newText });
      if (trackEditTimeout.current) clearTimeout(trackEditTimeout.current);
      trackEditTimeout.current = setTimeout(() => {
        trackEvent('generated_post_edited', { length: newText.length });
      }, 2000);
    }
  };

  const handleCopy = () => {
    if (!demoResult?.post) return;
    navigator.clipboard.writeText(demoResult.post);
    setHasCopied(true);
    trackEvent('generated_post_copied', { length: demoResult.post.length });
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleWizardGenerate = async () => {
    if (!demoUrl) return;
    
    if (demoUrl.length > 5) trackEvent('repository_url_entered', { url: demoUrl });
    trackEvent('repository_analysis_started');

    setDemoStep(3);
    setPhase('analyzing');
    setDemoError('');
    setDemoResult(null);

    try {
      // 1. Analyze
      const res = await fetch("/api/demo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          repoUrl: demoUrl, 
          projectDescription: "", 
          intent: selectedMainIntent,
          lang 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze repository');
      
      const analysisToken = data.analysisToken || '';
      const angles = data.angles || [];
      const angle = angles[0];
      
      if (!angle) throw new Error("No angles generated");
      
      setPhase('generating');
      
      // 2. Generate
      const genRes = await fetch("/api/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: demoUrl,
          projectDescription: "",
          analysisToken,
          humanContext: targetAudience,
          angleId: angle.id,
          lang
        })
      });
      
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Failed to generate post');
      
      setDemoResult({
        repository: data.repository,
        selectedIntent: selectedMainIntent,
        evidence: genData.evidence,
        conflicts: genData.conflicts,
        post: genData.post
      });
      setPhase('result');
      trackEvent('post_generation_succeeded');
    } catch (e: any) {
      setDemoError(e.message);
      setDemoStep(2);
      setPhase('idle');
      trackEvent('post_generation_failed', { error: e.message });
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden ${isRtl ? 'font-arabic' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background Visuals */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 p-1.5 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">{T.appTitle}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Beautiful Segmented Language Switcher */}
          <div className="hidden sm:flex bg-slate-900/50 p-1 rounded-xl border border-white/5 backdrop-blur-md items-center shadow-inner">
            {(['en', 'ar', 'de'] as const).map(l => (
              <button 
                key={l}
                onClick={() => onToggleLang(l)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-300 uppercase tracking-wider ${
                  lang === l 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          
          {/* Mobile compact language switcher */}
          <button 
            onClick={() => onToggleLang()} 
            className="sm:hidden text-sm font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5"
          >
            <Globe size={15} />
            <span className="uppercase text-[11px] font-bold">{lang}</span>
          </button>

          {view === 'landing' ? (
            <button 
              onClick={() => {
                setView('login');
                trackEvent('authentication_started', { source: 'nav' });
              }}
              className="text-sm font-bold bg-white/10 hover:bg-white/20 border border-white/10 text-white px-5 py-2 rounded-xl transition-all hover:scale-105"
            >
              {T.landingLoginBtn}
            </button>
          ) : (
            <button 
              onClick={() => setView('landing')}
              className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={16} className={isRtl ? "rotate-180" : ""} />
              {T.landingBackToHome}
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div
            key="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center"
          >
            {/* HERO */}
            <div className="text-center max-w-4xl mx-auto mb-20">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 mb-6 leading-[1.1]">
                {T.landingHeroTitle}
              </h1>
              <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-3xl mx-auto">
                {T.landingHeroDesc}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                <button
                  onClick={scrollToDemo}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:-translate-y-1"
                >
                  {T.landingCtaPrimary}
                </button>
                <button
                  onClick={() => {
                    setView('login');
                    trackEvent('authentication_started', { source: 'hero' });
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold text-lg rounded-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  <GithubIcon size={20} />
                  {T.landingCtaSecondary}
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium">{T.landingTrustMicrocopy}</p>
            </div>

            {/* DEMO SECTION */}
            <motion.div ref={demoRef} className="w-full max-w-4xl mb-32 bg-slate-900 border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden group shadow-xl">
              <div className="absolute top-0 end-0 p-2 bg-gradient-to-l from-indigo-500/20 to-purple-500/20 border-b border-s border-white/10 rounded-es-xl text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles size={12} className="animate-pulse" />
                Live Demo
              </div>
              
              <div className="text-center mb-10">
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                  {T.demoTitle}
                </h3>
                <p className="text-sm text-slate-400">
                  {T.demoDesc}
                </p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {demoError && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl text-center flex items-center justify-center gap-2">
                    <span className="font-bold">Error:</span> {demoError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic Phases */}
              <AnimatePresence mode="wait">
                {/* Step 1: Input URL */}
                {demoStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="space-y-6 max-w-2xl mx-auto"
                  >
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">{T.demoStep1Title}</label>
                      <div className="relative flex items-center bg-slate-950 border border-white/10 rounded-xl p-1 focus-within:border-indigo-500/50 transition-colors">
                        <GithubIcon size={20} className="text-slate-500 mx-3 shrink-0" />
                        <input 
                          type="text" 
                          placeholder="https://github.com/facebook/react" 
                          value={demoUrl}
                          onChange={(e) => setDemoUrl(e.target.value)}
                          className="w-full bg-transparent border-none text-white focus:outline-none placeholder:text-slate-600 font-mono text-sm py-3"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="pt-4">
                      <button 
                        onClick={() => setDemoStep(2)}
                        disabled={!demoUrl}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {T.demoWizardNextBtn}
                        <ArrowRight size={18} className={isRtl ? "rotate-180" : ""} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Configuration */}
                {demoStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="space-y-8 max-w-4xl mx-auto"
                  >
                    <div className="bg-[#0a0a0a] p-8 rounded-[2rem] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                      <div className="flex items-center justify-between mb-8">
                         <label className="block text-lg font-bold text-white flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                             <Sparkles size={16} />
                           </div>
                           {T.demoStep2Title}
                         </label>
                      </div>
                      <IntentCards selectedIntent={selectedMainIntent} onSelectIntent={setSelectedMainIntent} lang={lang} />
                    </div>

                    <div className="bg-[#0a0a0a] p-8 rounded-[2rem] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                      <label className="block text-sm font-bold text-slate-300 mb-4">{T.demoAudienceLabel}</label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { id: 'Software Engineers', label: T.demoAudienceSoftwareEngineers },
                          { id: 'CTOs/Tech Leads', label: T.demoAudienceCTOs },
                          { id: 'Recruiters/HR', label: T.demoAudienceRecruiters },
                          { id: 'General Public', label: T.demoAudienceGeneral }
                        ].map(audience => (
                          <button
                            key={audience.id}
                            onClick={() => setTargetAudience(audience.id)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                              targetAudience === audience.id 
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-inner' 
                                : 'bg-[#111] text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-300 hover:bg-[#161616]'
                            }`}
                          >
                            {audience.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button 
                        onClick={() => setDemoStep(1)}
                        className="flex-[1] py-4 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
                      >
                        {T.demoWizardBackBtn}
                      </button>
                      <button 
                        onClick={handleWizardGenerate}
                        className="flex-[2] flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg"
                      >
                        {T.demoWizardGenerateBtn}
                        <ArrowRight size={18} className={isRtl ? "rotate-180" : ""} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Loading */}
                {demoStep === 3 && phase !== 'result' && (
                  <motion.div
                    key="step-3-loading"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="max-w-xl mx-auto text-center"
                  >
                    <TransformationLoader 
                      label={phase === 'analyzing' ? T.demoLoadingAnalyzing : T.demoLoadingDrafting} 
                    />
                  </motion.div>
                )}

                {/* Step 3: Result */}
                {demoStep === 3 && phase === 'result' && demoResult && (
                  <motion.div 
                    key="step-3-result"
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                  >
                    {/* Left: Metadata & Evidence */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Repo info */}
                      <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5">
                        <div className="flex flex-col gap-1 mb-4 pb-4 border-b border-white/5">
                          <h4 className="text-white font-bold text-lg flex items-center gap-2">
                            <GithubIcon size={18} className="text-indigo-400" />
                            {demoResult.repository?.name || T.repoFallbackName}
                          </h4>
                          <p className="text-sm text-slate-400">{demoResult.repository?.description || T.repoFallbackDesc}</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-start gap-2 text-sm">
                            <Target size={16} className="text-slate-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-slate-500 block text-xs">Intent</span>
                              <span className="text-indigo-300 font-medium">{demoResult.selectedIntent}</span>
                            </div>
                          </div>
                          
                          {demoResult.evidence && demoResult.evidence.length > 0 && (
                            <div className="flex items-start gap-2 text-sm pt-2">
                              <Zap size={16} className="text-slate-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-slate-500 block text-xs mb-1">{T.demoEvidenceTitle}</span>
                                <ul className="text-emerald-400 space-y-2">
                                  {demoResult.evidence.map((ev: any, idx: number) => (
                                    <li key={idx} className="flex gap-1.5 items-start">
                                      <span className="opacity-50 mt-1">•</span>
                                      <span className="leading-snug text-[13px]">
                                        {typeof ev === 'string' ? ev : ev.fact}
                                        {ev.source && <span className="block mt-0.5 text-[10px] font-mono text-emerald-400/50 uppercase tracking-wider">{T.demoEvidenceSource}: {ev.source}</span>}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 shadow-lg">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{T.demoResultWarning}</p>
                      </div>
                    </div>

                    {/* Right: The Post */}
                    <div className="lg:col-span-7">
                      <motion.div 
                        initial={{ boxShadow: "0 0 0 rgba(99,102,241,0)" }}
                        animate={{ boxShadow: ["0 0 0 rgba(99,102,241,0)", "0 0 40px rgba(99,102,241,0.3)", "0 0 0 rgba(99,102,241,0)"] }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative group"
                      >
                        <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            <User size={20} className="text-slate-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">{lang === 'ar' ? 'أنت (المستخدم)' : 'You (User)'}</h4>
                            <p className="text-[11px] text-slate-500">Software Engineer • 1st</p>
                          </div>
                          <div className="ms-auto text-slate-600">
                            <LinkedinIcon size={20} />
                          </div>
                        </div>
                        
                        <textarea
                          value={demoResult.post || demoResult.generatedPost || ''}
                          onChange={(e) => handlePostChange(e.target.value)}
                          className="w-full min-h-[250px] bg-transparent text-sm leading-relaxed text-slate-200 mb-6 whitespace-pre-wrap font-sans resize-y focus:outline-none border border-transparent focus:border-indigo-500/30 p-2 rounded-xl transition-colors"
                        />

                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                          <button
                            onClick={() => { setDemoStep(1); setDemoUrl(''); }}
                            className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
                          >
                            <RefreshCw size={14} className="inline me-1" />
                            {lang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                          </button>
                          <button
                            onClick={handleCopy}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all relative overflow-hidden ${
                              hasCopied 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                            }`}
                          >
                            {hasCopied ? (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                                <Check size={16} />
                                {T.demoCopiedBtn}
                              </motion.div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {T.demoCopyBtn}
                              </div>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Conversion Footer inside Demo block */}
              {demoResult && phase === 'result' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-12 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] pointer-events-none" />
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{T.demoConversionCta}</h3>
                  <p className="text-sm text-indigo-200/80 mb-6 max-w-2xl mx-auto">{T.demoConversionSub}</p>
                  <button
                    onClick={() => {
                      trackEvent('github_connect_clicked', { source: 'demo_conversion' });
                      setView('login');
                    }}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg"
                  >
                    <GithubIcon size={20} />
                    {T.demoConversionBtn}
                  </button>
                  <p className="text-xs text-slate-400 mt-4 flex items-center justify-center gap-2">
                    <Check size={14} className="text-indigo-400" />
                    {T.demoConversionTrust}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* SECTIONS */}
            <div className="w-full max-w-5xl space-y-32 mb-32">
              {/* Problem */}
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{T.sectionProblemTitle}</h2>
                <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">{T.sectionProblemText}</p>
              </div>

              {/* The Bento Grid (Why Us) */}
              <div className="pt-10">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-white/[0.08] text-slate-300 text-[11px] font-semibold tracking-wider uppercase mb-6 shadow-inner">
                    <Sparkles size={12} className="text-slate-400" />
                    <span>The LinkedIn Authority Advantage</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                    {T.sectionCompareTitle}
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Large Card: Real Work on GitHub */}
                  <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] p-8 md:p-10 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-white/[0.15] transition-colors duration-500">
                    
                    <div className="flex flex-col md:flex-row gap-10 relative z-10 h-full items-center">
                      <div className="flex-1 space-y-5">
                        <div className="w-12 h-12 bg-slate-900 border border-white/[0.08] rounded-xl flex items-center justify-center text-slate-400 mb-6 shadow-inner group-hover:text-white transition-colors duration-500">
                          <GithubIcon size={24} />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight">{T.sectionCompareUs1}</h3>
                        <p className="text-slate-400 leading-relaxed text-base md:text-lg font-light">{T.sectionCompareUs2}</p>
                      </div>

                      {/* Visual Graphic: Abstract Data Flow */}
                      <div className="flex-1 w-full bg-[#111] rounded-2xl border border-white/[0.05] p-6 shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[220px]">
                        {/* Grid Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
                        
                        {/* Flow lines and nodes */}
                        <div className="relative w-full h-full flex items-center justify-center">
                           <div className="absolute w-3/4 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent opacity-50"></div>
                           <div className="absolute w-[1px] h-3/4 bg-gradient-to-b from-transparent via-slate-600 to-transparent opacity-50"></div>
                           <div className="absolute w-40 h-40 rounded-full border border-slate-700/50 scale-[0.6]"></div>
                           
                           {/* Pulsing Core */}
                           <div className="relative w-12 h-12 bg-[#0a0a0a] border border-slate-700 rounded-lg flex items-center justify-center z-10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                             <div className="w-3 h-3 bg-slate-300 rounded-sm animate-pulse"></div>
                           </div>

                           {/* Satellites */}
                           <div className="absolute top-1/4 start-1/4 w-2.5 h-2.5 bg-slate-500 rounded-full border border-[#111]"></div>
                           <div className="absolute bottom-1/4 end-1/4 w-2.5 h-2.5 bg-slate-600 rounded-full border border-[#111]"></div>
                        </div>

                        {/* Subtle highlight gradient on hover */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>

                  {/* Small Vertical Cards */}
                  <div className="lg:col-span-4 flex flex-col gap-5">
                    <div className="flex-1 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] p-8 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-white/[0.15] transition-colors duration-500 flex flex-col justify-center">
                      <div className="absolute top-0 end-0 p-6 opacity-0 -translate-y-2 translate-x-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-500 text-slate-600">
                        <ArrowRight size={20} className="rtl:rotate-180" />
                      </div>
                      <div className="w-10 h-10 bg-slate-900 border border-white/[0.08] rounded-lg flex items-center justify-center text-slate-400 mb-5 shadow-inner group-hover:text-white transition-colors duration-500">
                        <BrainCircuit size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{T.sectionCompareUs3}</h3>
                      <p className="text-sm text-slate-400 font-light leading-relaxed">The AI engine adapts to the specific narrative angle you choose.</p>
                    </div>
                    
                    <div className="flex-1 bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] p-8 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-white/[0.15] transition-colors duration-500 flex flex-col justify-center">
                      <div className="absolute top-0 end-0 p-6 opacity-0 -translate-y-2 translate-x-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-500 text-slate-600">
                        <ArrowRight size={20} className="rtl:rotate-180" />
                      </div>
                      <div className="w-10 h-10 bg-slate-900 border border-white/[0.08] rounded-lg flex items-center justify-center text-slate-400 mb-5 shadow-inner group-hover:text-white transition-colors duration-500">
                        <ShieldCheck size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{T.sectionCompareUs4}</h3>
                      <p className="text-sm text-slate-400 font-light leading-relaxed">No hallucinations. Every claim is cryptographically backed by commits.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* How it Works (Pipeline Flow) */}
              <div className="pt-10">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-6 tracking-tight">
                    {T.sectionHowTitle}
                  </h2>
                </div>
                
                <div className="relative max-w-5xl mx-auto bg-[#0a0a0a] border border-white/[0.08] rounded-[2rem] p-8 md:p-12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  {/* Connecting Line (Desktop) */}
                  <div className="hidden md:block absolute top-[5.5rem] start-24 end-24 h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-60"></div>
                  
                  <div className="grid md:grid-cols-3 gap-12 md:gap-8 relative z-10">
                    {[
                      { title: T.sectionHow1Title, desc: T.sectionHow1Text, icon: GithubIcon },
                      { title: T.sectionHow2Title, desc: T.sectionHow2Text, icon: Workflow },
                      { title: T.sectionHow3Title, desc: T.sectionHow3Text, icon: LinkedinIcon }
                    ].map((step, i) => (
                      <div key={i} className="flex flex-col items-center group relative">
                        <div className="mb-6 relative">
                          {/* Sleek Node */}
                          <div className="w-14 h-14 bg-[#0a0a0a] border border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 relative z-10 transition-all duration-500 group-hover:border-slate-400 group-hover:text-white group-hover:-translate-y-1 group-hover:shadow-[0_8px_30px_rgba(255,255,255,0.08)] bg-[linear-gradient(110deg,#0a0a0a,45%,#1a1a1a,55%,#0a0a0a)] bg-[length:200%_100%] group-hover:animate-[shimmer_2s_infinite]">
                            <step.icon size={22} />
                          </div>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2 text-center tracking-tight">{step.title}</h4>
                        <p className="text-slate-400 leading-relaxed text-sm text-center max-w-[240px] font-light">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recap */}
              <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-10 md:p-12 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">{T.sectionRecapTitle}</h2>
                <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">{T.sectionRecapText}</p>
              </div>

              {/* Final CTA (Intense Gradient) */}
              <div className="text-center pb-20 pt-10">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full" />
                  <h2 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-6 relative z-10 tracking-tight">
                    {T.finalCtaTitle}
                  </h2>
                </div>
                <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">{T.finalCtaDesc}</p>
                
                <button
                  onClick={scrollToDemo}
                  className="group relative px-10 py-5 bg-white text-slate-950 font-bold text-lg rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] hover:scale-105 transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/50 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 ease-in-out transition-transform"></div>
                  <span className="relative z-10 flex items-center gap-3">
                    {T.landingCtaPrimary}
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <footer className="w-full border-t border-white/5 pt-8 flex flex-col items-center justify-center gap-4 text-center text-xs text-slate-500">
              <p>© 2026 {T.appTitle}. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => setIsAboutOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-900/30 border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-900/50 rounded-full transition-all text-indigo-300 hover:text-white"
                >
                  <Sparkles size={14} className="text-indigo-400" />
                  {lang === 'ar' ? 'من نحن (القصة والرؤية)' : 'About Us (Vision & Story)'}
                </button>

                <button 
                  onClick={() => openLegalTab('developer')} 
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-white/10 hover:border-indigo-500/50 hover:bg-slate-800 rounded-full transition-all text-slate-300 hover:text-white"
                >
                  <User size={14} className="text-indigo-400" />
                  {lang === 'ar' ? 'المطور والمعلومات القانونية (Impressum)' : 'Developer & Legal (Impressum)'}
                </button>
              </div>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="login-page"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 min-h-[80vh] flex items-center justify-center px-6 py-12"
          >
            <motion.div className="bg-slate-900 border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden w-full max-w-md shadow-2xl">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="w-16 h-16 mx-auto bg-slate-950 border border-white/5 rounded-2xl flex items-center justify-center mb-4 relative shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 rounded-2xl" />
                  <Lock className="w-6 h-6 text-indigo-400 relative z-10" />
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-2">{T.landingLoginBtn}</h2>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {lang === 'ar' 
                    ? 'قم بتسجيل الدخول بأمان لربط حساباتك وإعداد قنوات البث التلقائي.' 
                    : 'Sign in securely to link your accounts and configure your automation settings.'}
                </p>
              </div>

              {/* Login Actions */}
              <div className="space-y-4">
                <button
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                    } catch (e) {
                      console.error("Google login failed", e);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{lang === 'ar' ? 'متابعة باستخدام Google' : 'Continue with Google'}</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      await signInWithGithub();
                    } catch (e) {
                      console.error("Github login failed", e);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-slate-950 border border-white/5 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <GithubIcon size={20} />
                  <span>{lang === 'ar' ? 'متابعة باستخدام GitHub' : 'Continue with GitHub'}</span>
                </button>

                {/* Legal Consent Text */}
                <div className="text-center text-[10px] text-slate-400 mt-4 leading-relaxed max-w-xs mx-auto">
                  {lang === 'ar' ? (
                    <>
                      بتسجيل الدخول، فإنك توافق على{" "}
                      <button onClick={() => openLegalTab('terms')} className="text-indigo-400 hover:underline">شروط الخدمة</button>
                      {" "}و{" "}
                      <button onClick={() => openLegalTab('privacy')} className="text-indigo-400 hover:underline">سياسة الخصوصية</button>
                      {" "}الخاصة بنا.
                    </>
                  ) : lang === 'de' ? (
                    <>
                      Mit der Anmeldung stimmen Sie unseren{" "}
                      <button onClick={() => openLegalTab('terms')} className="text-indigo-400 hover:underline">Nutzungsbedingungen</button>
                      {" "}und{" "}
                      <button onClick={() => openLegalTab('privacy')} className="text-indigo-400 hover:underline">Datenschutzrichtlinien</button>
                      {" "}zu.
                    </>
                  ) : (
                    <>
                      By signing in, you agree to our{" "}
                      <button onClick={() => openLegalTab('terms')} className="text-indigo-400 hover:underline">Terms of Service</button>
                      {" "}and{" "}
                      <button onClick={() => openLegalTab('privacy')} className="text-indigo-400 hover:underline">Privacy Policy</button>
                      .
                    </>
                  )}
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-500 bg-slate-950/50 p-2.5 rounded-lg border border-white/5">
                <Check size={12} className="text-indigo-400" />
                <span>{lang === 'ar' ? 'ربط آمن بنظام تشفير وقواعد أمان صارمة' : 'Secured with Enterprise-Grade TLS Encryption'}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LegalModal 
        lang={lang}
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialTab={legalTab}
      />
      <AboutUsModal
        lang={lang}
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
};

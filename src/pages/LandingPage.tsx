import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Bot, Globe, Check, Sparkles, Lock, ArrowLeft,
  User, RefreshCw, Zap, Target
} from 'lucide-react';
import { useAuth } from '../application/AuthContext';
import { t } from '../locales';
import { trackEvent } from '../utils/analytics';
import { LegalModal } from '../components/Layout/LegalModal';
import { AboutUsModal } from '../components/Layout/AboutUsModal';

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
  
  // Interactive Demo States
  const [demoUrl, setDemoUrl] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [phase, setPhase] = useState<DemoPhase>('idle');
  
  const [angles, setAngles] = useState<any[]>([]);
  const [analyzeConflicts, setAnalyzeConflicts] = useState<any[]>([]);
  const [selectedAngleId, setSelectedAngleId] = useState<string>('');
  const [customAngle, setCustomAngle] = useState('');
  
  const [humanContext, setHumanContext] = useState('');
  
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

  const handleAnalyze = async () => {
    if (!demoUrl) return;
    
    if (demoUrl.length > 5) trackEvent('repository_url_entered', { url: demoUrl });
    trackEvent('repository_analysis_started');

    setPhase('analyzing');
    setDemoError('');
    setDemoResult(null);
    setAnalyzeConflicts([]);

    try {
      const res = await fetch("/api/demo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: demoUrl, projectDescription: projectDescription.slice(0, 200), lang })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze repository');
      }
      
      if (data.needsUserContext) {
        setPhase('needs_context');
        trackEvent('generation_needs_context');
        return;
      }
      
      setAngles(data.angles || []);
      setAnalyzeConflicts(data.conflicts || []);
      setDemoResult({ repository: data.repository }); // Save repo metadata early
      setPhase('angles');
      trackEvent('repository_analysis_succeeded', { count: data.angles?.length });
    } catch (e: any) {
      setDemoError(e.message);
      setPhase('idle');
      trackEvent('repository_analysis_failed', { error: e.message });
    }
  };

  const handleAngleSelection = () => {
    if (!selectedAngleId) return;
    
    if (selectedAngleId === 'custom') {
      if (!customAngle) return;
      trackEvent('custom_angle_entered', { length: customAngle.length });
      setPhase('generating');
      handleGenerate('custom', customAngle, false);
      return;
    }

    const angle = angles.find(a => a.id === selectedAngleId);
    if (!angle) return;

    trackEvent('candidate_angle_selected', { angleId: angle.id });

    if (angle.requiresHumanContext) {
      setPhase('adaptive_question');
    } else {
      setPhase('generating');
      handleGenerate(angle.id, angle.title, false);
    }
  };

  const submitAdaptiveQuestion = () => {
    if (!humanContext) return;
    trackEvent('adaptive_question_answered', { length: humanContext.length });
    
    const angle = angles.find(a => a.id === selectedAngleId);
    if (!angle) return;

    setPhase('generating');
    handleGenerate(angle.id, angle.title, true);
  };

  const handleGenerate = async (intentId: string, intentLabel: string, requiresContext: boolean) => {
    trackEvent('post_generation_started');
    setDemoError('');
    
    try {
      const payload = {
        repoUrl: demoUrl,
        projectDescription: projectDescription.slice(0, 200),
        intent: intentId === 'custom' ? customAngle : intentLabel,
        humanContext: humanContext.slice(0, 200),
        angleRequiresContext: requiresContext,
        lang
      };

      const res = await fetch("/api/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate post');
      }
      
      setDemoResult(prev => ({
        ...prev,
        selectedIntent: intentId === 'custom' ? customAngle : intentLabel,
        evidence: data.evidence,
        conflicts: data.conflicts,
        post: data.post
      }));
      setPhase('result');
      trackEvent('post_generation_succeeded');
    } catch (e: any) {
      setDemoError(e.message);
      // Revert phase based on intent type
      if (intentId === 'custom') setPhase('angles');
      else if (requiresContext) setPhase('adaptive_question');
      else setPhase('angles');
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
            <div ref={demoRef} className="w-full max-w-4xl mb-32 bg-slate-900/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md relative shadow-2xl overflow-hidden min-h-[400px]">
              <div className="absolute top-0 right-0 p-2 bg-gradient-to-l from-indigo-500/20 to-purple-500/20 border-b border-l border-white/10 rounded-bl-xl text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1.5">
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
                {/* Phase 1: Idle & Needs Context */}
                {(phase === 'idle' || phase === 'analyzing' || phase === 'needs_context') && (
                  <motion.div
                    key="phase-idle"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
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
                          disabled={phase === 'analyzing'}
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {phase === 'needs_context' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mb-3 mt-2 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-xl flex items-start gap-3">
                            <span className="shrink-0 mt-0.5 text-lg">⚠️</span>
                            <div>
                              <p className="font-bold text-base">{T.demoNeedsContextTitle}</p>
                              <p className="text-amber-200/80 mt-1">{T.demoNeedsContextDesc}</p>
                            </div>
                          </div>
                          <textarea 
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            placeholder={T.demoContextInputPlaceholder}
                            maxLength={200}
                            rows={3}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500/50 transition-colors resize-none text-sm mt-2"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-4">
                      <button 
                        onClick={handleAnalyze}
                        disabled={phase === 'analyzing' || !demoUrl || (phase === 'needs_context' && !projectDescription)}
                        className="w-full overflow-hidden relative flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                      >
                        {phase === 'analyzing' ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                            <RefreshCw size={18} />
                          </motion.div>
                        ) : (
                          <Sparkles size={18} className="group-hover/btn:scale-110 transition-transform" />
                        )}
                        <span>{phase === 'analyzing' ? T.demoAnalyzingState : T.demoAnalyzeBtn}</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Phase 2: Angles Selection */}
                {phase === 'angles' && (
                  <motion.div
                    key="phase-angles"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="max-w-2xl mx-auto"
                  >
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-white mb-2">{T.demoAnglesTitle}</h4>
                      <p className="text-sm text-slate-400">{T.demoAnglesSubtitle}</p>
                    </div>
                    
                    <div className="space-y-3">
                      {analyzeConflicts.map((conflict, idx) => (
                        <div key={idx} className="mb-4 text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 shadow-lg">
                          <div className="shrink-0 mt-0.5">⚠️</div>
                          <div>
                            <p className="font-bold text-amber-500">{T.demoConflictWarning || 'Analysis Warning'}</p>
                            <p className="mt-1">{conflict.safeAlternative || conflict.claim}</p>
                          </div>
                        </div>
                      ))}

                      {angles.map((angle, idx) => (
                        <button
                          key={angle.id}
                          onClick={() => setSelectedAngleId(angle.id)}
                          className={`w-full text-left px-5 py-4 rounded-xl border transition-all flex flex-col gap-2 ${
                            selectedAngleId === angle.id 
                              ? 'bg-indigo-500/20 border-indigo-500/50' 
                              : 'bg-slate-950 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${selectedAngleId === angle.id ? 'text-indigo-300' : 'text-slate-200'}`}>
                              {angle.title}
                            </span>
                            {angle.recommended && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{T.demoAngleRecommended}</span>}
                          </div>
                          <span className="text-sm text-slate-400 leading-relaxed">{angle.angleSummary}</span>
                          
                          {angle.audienceValue && (
                            <div className="mt-2 text-xs bg-white/5 p-2 rounded-lg border border-white/5 flex gap-2 items-start">
                              <Target size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wide">{T.demoAudienceValue || 'Value'}</span>
                                <span className="text-slate-300">{angle.audienceValue}</span>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setSelectedAngleId('custom')}
                        className={`w-full text-left px-5 py-4 rounded-xl border transition-all flex flex-col gap-2 ${
                          selectedAngleId === 'custom' 
                            ? 'bg-indigo-500/20 border-indigo-500/50' 
                            : 'bg-slate-950 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className={`font-bold ${selectedAngleId === 'custom' ? 'text-indigo-300' : 'text-slate-200'}`}>
                          {T.demoAngleCustom}
                        </span>
                        {selectedAngleId === 'custom' && (
                          <textarea
                            value={customAngle}
                            onChange={(e) => setCustomAngle(e.target.value)}
                            placeholder={T.demoAngleCustomPlaceholder}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none mt-1"
                            rows={2}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </button>
                    </div>

                    <div className="pt-8">
                      <button 
                        onClick={handleAngleSelection}
                        disabled={!selectedAngleId || (selectedAngleId === 'custom' && !customAngle)}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {T.demoGenerateBtn}
                        <ArrowRight size={18} className={isRtl ? "rotate-180" : ""} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Phase 3: Adaptive Question */}
                {phase === 'adaptive_question' && (
                  <motion.div
                    key="phase-adaptive"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="max-w-xl mx-auto text-center"
                  >
                    <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Bot size={32} />
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-2">{T.demoAdaptiveQuestionTitle}</h4>
                    <p className="text-slate-400 mb-8">{angles.find(a => a.id === selectedAngleId)?.adaptiveQuestion || T.demoContextHelp}</p>
                    
                    <textarea 
                      value={humanContext}
                      onChange={(e) => setHumanContext(e.target.value)}
                      placeholder="..."
                      maxLength={200}
                      rows={3}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500/50 transition-colors resize-none text-sm text-left mb-6"
                      dir="auto"
                    />

                    <div className="flex gap-4">
                      <button 
                        onClick={() => setPhase('angles')}
                        className="flex-1 py-4 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
                      >
                        {T.cancelScheduleBtn}
                      </button>
                      <button 
                        onClick={submitAdaptiveQuestion}
                        disabled={!humanContext}
                        className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        {T.demoGenerateBtn}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Phase 4: Generating */}
                {phase === 'generating' && (
                  <motion.div
                    key="phase-generating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-xl mx-auto text-center py-12"
                  >
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1.5 }} className="inline-block mb-6 text-indigo-400">
                      <RefreshCw size={48} />
                    </motion.div>
                    <h4 className="text-xl font-bold text-white mb-2">{T.demoGeneratingState}</h4>
                    <p className="text-slate-400">This takes a few seconds...</p>
                  </motion.div>
                )}

                {/* Phase 5: Result */}
                {phase === 'result' && demoResult && (
                  <motion.div 
                    key="phase-result"
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
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
                        <div className="shrink-0 mt-0.5">⚠️</div>
                        <p className="leading-relaxed">{T.demoResultWarning}</p>
                      </div>
                    </div>

                    {/* Right: The Post */}
                    <div className="lg:col-span-7">
                      <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative group">
                        <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            <User size={20} className="text-slate-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">{lang === 'ar' ? 'أنت (المستخدم)' : 'You (User)'}</h4>
                            <p className="text-[11px] text-slate-500">Software Engineer • 1st</p>
                          </div>
                          <div className="ml-auto text-slate-600">
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
                            onClick={() => setPhase('idle')}
                            className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
                          >
                            <RefreshCw size={14} className="inline mr-1" />
                            Start Over
                          </button>
                          <button
                            onClick={handleCopy}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                              hasCopied 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                            }`}
                          >
                            {hasCopied ? <Check size={16} /> : null}
                            {hasCopied ? T.demoCopiedBtn : T.demoCopyBtn}
                          </button>
                        </div>
                      </div>
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
            </div>

            {/* SECTIONS */}
            <div className="w-full max-w-5xl space-y-32 mb-32">
              {/* Problem */}
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{T.sectionProblemTitle}</h2>
                <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">{T.sectionProblemText}</p>
              </div>

              {/* Compare */}
              <div>
                <h2 className="text-3xl font-bold text-center text-white mb-12">{T.sectionCompareTitle}</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Generic */}
                  <div className="bg-slate-900/30 border border-red-500/20 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-red-400 mb-6 pb-4 border-b border-white/5">{T.sectionCompareGenTitle}</h3>
                    <ul className="space-y-4 text-slate-400">
                      {[T.sectionCompareGen1, T.sectionCompareGen2, T.sectionCompareGen3, T.sectionCompareGen4].map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-red-500/50 mt-1 shrink-0">✗</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Us */}
                  <div className="bg-indigo-900/10 border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px]" />
                    <h3 className="text-xl font-bold text-indigo-400 mb-6 pb-4 border-b border-white/5">{T.sectionCompareUsTitle}</h3>
                    <ul className="space-y-4 text-slate-200">
                      {[T.sectionCompareUs1, T.sectionCompareUs2, T.sectionCompareUs3, T.sectionCompareUs4].map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <Check size={18} className="text-indigo-400 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-12">{T.sectionHowTitle}</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { title: T.sectionHow1Title, desc: T.sectionHow1Text, icon: GithubIcon },
                    { title: T.sectionHow2Title, desc: T.sectionHow2Text, icon: Target },
                    { title: T.sectionHow3Title, desc: T.sectionHow3Text, icon: LinkedinIcon }
                  ].map((step, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                        <step.icon size={28} />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-3">{step.title}</h4>
                      <p className="text-slate-400 leading-relaxed text-sm">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recap */}
              <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-10 md:p-12 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">{T.sectionRecapTitle}</h2>
                <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">{T.sectionRecapText}</p>
              </div>

              {/* Final CTA */}
              <div className="text-center pb-20">
                <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-6">{T.finalCtaTitle}</h2>
                <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">{T.finalCtaDesc}</p>
                <button
                  onClick={scrollToDemo}
                  className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] hover:scale-105 transition-all"
                >
                  {T.landingCtaPrimary}
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
            <div className="w-full max-w-md bg-slate-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              
              <div className="text-center mb-8">
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
            </div>
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Share2, 
  ArrowRight, 
  Bot, 
  Code2, 
  Globe, 
  Check, 
  ChevronDown, 
  Sparkles, 
  Lock, 
  ArrowLeft,
  User
} from 'lucide-react';
import { useAuth } from '../application/AuthContext';
import { t } from '../locales';

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

import { LegalModal } from '../components/Layout/LegalModal';
import { AboutUsModal } from '../components/Layout/AboutUsModal';

export const LandingPage = ({ lang, onToggleLang }: { lang: 'en' | 'ar' | 'de', onToggleLang: () => void }) => {
  const { signInWithGoogle, signInWithGithub } = useAuth();
  const [view, setView] = useState<'landing' | 'login'>('landing');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Legal & About Modals states
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms' | 'developer'>('privacy');

  const openLegalTab = (tab: 'privacy' | 'terms' | 'developer') => {
    setLegalTab(tab);
    setIsLegalOpen(true);
  };

  const isRtl = lang === 'ar';
  const T = t[lang] || t['ar'];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden ${isRtl ? 'font-arabic' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background Visual Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header / Navigation */}
      <nav className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-white/5 backdrop-blur-md bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/50 p-1.5 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <img src="/logo.png" alt="LinkedIn Authority Engine Logo" className="w-7 h-7 object-contain" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">{T.appTitle}</span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleLang} 
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5"
          >
            <Globe size={15} />
            {lang === 'ar' ? 'English' : lang === 'en' ? 'Deutsch' : 'العربية'}
          </button>

          {view === 'landing' ? (
            <button 
              onClick={() => setView('login')}
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

      {/* Main Container with Page View Transitions */}
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div
            key="landing-page"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
              <Sparkles size={12} />
              <span>{lang === 'ar' ? 'أتمتة المحتوى المدعومة بـ Gemini' : 'AI-Powered Authority Engine'}</span>
            </div>

            {/* Hero Main Heading */}
            <h1 className="text-4xl md:text-7xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 mb-6 max-w-5xl leading-tight">
              {T.landingHeroTitle}
            </h1>

            {/* Hero Description */}
            <p className="text-lg md:text-xl text-slate-400 text-center max-w-3xl mb-10 leading-relaxed">
              {T.landingHeroDesc}
            </p>

            {/* Main CTA */}
            <button
              onClick={() => setView('login')}
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg rounded-2xl overflow-hidden transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                {T.landingCta}
                <ArrowRight size={20} className={`transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
              </span>
            </button>

            {/* Before / After Concept Showcase */}
            <div className="w-full max-w-4xl mt-20 mb-20 bg-slate-900/60 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-2 bg-indigo-500/10 border-b border-l border-white/5 rounded-bl-xl text-[10px] uppercase font-bold text-indigo-400">
                {lang === 'ar' ? 'نظام التحويل المرئي' : 'Transformation Sandbox'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Before: Raw Git / Code input */}
                <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-5 font-mono text-xs text-indigo-300">
                  <div className="flex items-center gap-2 mb-3 text-slate-500 border-b border-white/5 pb-2">
                    <Code2 size={14} />
                    <span>git log -n 1 --stat</span>
                  </div>
                  <p className="text-emerald-400">commit 89271df (HEAD -&gt; main)</p>
                  <p className="text-slate-400">Author: Obada Dallo</p>
                  <p className="text-slate-400">Date:   Thu Jul 16 21:05:32 2026</p>
                  <br />
                  <p className="text-white font-bold">feat: refactor Firebase App Hosting routes</p>
                  <p className="text-slate-500"> apphosting.yaml | 12 ++--</p>
                  <p className="text-slate-500"> src/App.tsx      | 85 +++++++++++---</p>
                  <p className="text-slate-500"> 2 files changed, 72 insertions(+), 25 deletions(-)</p>
                </div>

                {/* After: LinkedIn Post card */}
                <div className="bg-slate-950 border border-white/10 rounded-2xl p-5 text-sm text-slate-300 shadow-lg relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden">
                      <img src="/obada_portrait.webp" alt="Obada Dallo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Obada Dallo</h4>
                      <p className="text-[10px] text-slate-500">Software Architect • 1st</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300 mb-3">
                    🚀 <strong>Optimizing serverless deployments:</strong> Just shifted our app configuration structure directly to Google Cloud Secret Manager.
                  </p>
                  <p className="text-xs leading-relaxed text-slate-400 mb-3">
                    By extracting credentials from the build pipeline, we resolved runtime access scopes and enhanced environment security.
                  </p>
                  <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/30 p-3 rounded-lg text-[10px] text-indigo-300 font-mono">
                    #Serverless #GitHubAutomation #GeminiAI
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Grid Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-20">
              {/* Feature 1 */}
              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-5 text-indigo-400">
                  <GithubIcon size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{T.landingFeature1Title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{T.landingFeature1Desc}</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-5 text-emerald-400">
                  <Bot size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{T.landingFeature2Title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{T.landingFeature2Desc}</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mb-5 text-purple-400">
                  <Share2 size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{T.landingFeature3Title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{T.landingFeature3Desc}</p>
              </div>

              {/* Feature 4 */}
              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-5 text-blue-400">
                  <Zap size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{T.landingFeature4Title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{T.landingFeature4Desc}</p>
              </div>
            </div>

            {/* Interactive FAQ Section */}
            <div className="w-full max-w-3xl mb-20">
              <h2 className="text-3xl font-bold text-center text-white mb-10">{T.landingFaq}</h2>
              <div className="space-y-4">
                {[
                  { q: T.landingFaq1Q, a: T.landingFaq1A },
                  { q: T.landingFaq2Q, a: T.landingFaq2A },
                  { q: T.landingFaq3Q, a: T.landingFaq3A }
                ].map((faq, index) => (
                  <div key={index} className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-white transition-colors hover:bg-white/5"
                    >
                      <span className={isRtl ? "text-right w-full" : ""}>{faq.q}</span>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform ${activeFaq === index ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {activeFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5 bg-slate-950/40 text-xs text-slate-400 p-5 leading-relaxed"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
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


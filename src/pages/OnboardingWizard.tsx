import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Bot } from 'lucide-react';

const GithubIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/>
  </svg>
);


import confetti from 'canvas-confetti';
import { t } from '../locales';
import { useSettings } from '../contexts/SettingsContext';
import { auth, githubProvider, db } from '../infrastructure/firebase/config';
import { linkWithPopup, GithubAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const OnboardingWizard = ({ lang }: { lang: 'en'|'ar'|'de' }) => {
  const { settings, isOnboardingComplete } = useSettings();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const isRtl = lang === 'ar';
  const T = t[lang] || t['ar'];
  
  // Calculate connected states
  const ghConnected = !!(settings.githubUsername || settings.githubProfile);

  useEffect(() => {
    if (step === 1) {
      if (ghConnected) setStep(3);
      else setStep(2); // If welcome screen is dismissed (but here we show welcome on 1)
    }
    if (step === 3) {
      triggerConfetti();
    }
  }, [ghConnected, step]);

  const skipOnboarding = async () => {
    if (!auth.currentUser) return;
    const settingsRef = doc(db, "users", auth.currentUser.uid, "settings", "current");
    await setDoc(settingsRef, { onboardingSkipped: true }, { merge: true });
    window.location.reload();
  };

  const triggerConfetti = () => {
    const end = Date.now() + 2 * 1000;
    const colors = ['#818cf8', '#34d399', '#60a5fa'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const connectGithub = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const result = await linkWithPopup(auth.currentUser, githubProvider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token && result.user) {
        const userRes = await fetch('https://api.github.com/user', {
          headers: { Authorization: `token ${token}` }
        });
        const userData = await userRes.json();
        
        const settingsRef = doc(db, "users", result.user.uid, "settings", "current");
        await setDoc(settingsRef, {
            githubUsername: userData.login,
            githubToken: token,
            githubProfile: {
                login: userData.login,
                avatar_url: userData.avatar_url,
                name: userData.name
            }
        }, { merge: true });
        
        setStep(3);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };



  // If completely done, component logic in App.tsx will unmount this, but just in case:
  if (isOnboardingComplete && step !== 3) {
      return null;
  }

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 ${isRtl ? 'font-arabic' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[50vw] h-[50vh] bg-emerald-900/10 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        
        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-2 mb-12">
            {[1, 2, 3].map(idx => (
                <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${step >= idx ? 'w-12 bg-indigo-500' : 'w-4 bg-slate-800'}`} />
            ))}
        </div>

        <div className="relative h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Welcome */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">{T.onboardingWelcome || "Welcome"}</h2>
                <p className="text-slate-400 mb-8 max-w-sm">{T.onboardingWelcomeDesc || "Let's set up your integrations."}</p>
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  {isRtl ? 'البدء الآن' : 'Get Started'}
                </button>
              </motion.div>
            )}

            {/* Step 2: GitHub */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-6">
                  <GithubIcon size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">{T.onboardingStep1 || "Connect GitHub"}</h2>
                <p className="text-slate-400 mb-8 max-w-sm">{T.onboardingStep1Desc}</p>
                <button
                  onClick={connectGithub}
                  disabled={loading}
                  className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 border border-white/10 transition-colors flex justify-center items-center gap-2"
                >
                  {loading ? (isRtl ? 'جاري الربط...' : 'Connecting...') : (isRtl ? 'ربط الحساب' : 'Connect Account')}
                </button>
              </motion.div>
            )}



            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center bg-indigo-900/20 backdrop-blur-md rounded-3xl border border-indigo-500/20 p-8"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30">
                  <Check size={40} className="text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">{T.onboardingCompleteTitle}</h2>
                <p className="text-slate-300 mb-8 max-w-sm">{T.onboardingCompleteDesc}</p>
                
                {/* Notice the use of window.location.reload() to hard refresh and bypass onboarding in App.tsx */}
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                >
                  {T.onboardingGoToDashboard} <ArrowRight size={18} className={isRtl ? "rotate-180" : ""} />
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

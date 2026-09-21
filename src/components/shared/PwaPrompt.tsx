import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, Plus, X, Sparkles, CheckCircle } from 'lucide-react';

interface PwaPromptProps {
  lang: 'ar' | 'en' | 'de';
}

export const PwaPrompt: React.FC<PwaPromptProps> = ({ lang }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const checkStandalone =
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as any).standalone === true;
    
    setIsStandalone(checkStandalone);

    // 2. Detect iOS device specs
    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIos = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(detectIos);

    // 3. Listen for Android / Chrome Native Install Banner event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if user hasn't explicitly dismissed it previously in this session
      let dismissed = null;
      try { dismissed = sessionStorage.getItem('pwa_prompt_dismissed'); } catch {}
      if (!dismissed && !checkStandalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Check if we can show iOS custom prompt manually (if not in standalone mode and is iOS)
    let dismissed2 = null;
    try { dismissed2 = sessionStorage.getItem('pwa_prompt_dismissed'); } catch {}
    if (detectIos && !checkStandalone && !dismissed2) {
      // Delay slightly for dramatic/smooth entry
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA native install selection outcome: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    try { sessionStorage.setItem('pwa_prompt_dismissed', 'true'); } catch {}
  };

  // Translations Map
  const pwaT = {
    ar: {
      title: "الحصول على LinkedIn Authority كتطبيق هاتف 📲",
      desc: "قم بتثبيت التطبيق على شاشتك الرئيسية للوصول الأسرع إلى مساحة المسودات والمراجعة دون فتح المتصفح.",
      installBtn: "ثبّت التطبيق الآن ✨",
      installedTitle: "تم تثبيته بنجاح 🟢",
      installedDesc: "أنت تعمل الآن داخل بيئة تطبيق الجوال المستقلة (Native Standalone Engine).",
      iosTitle: "خطوات التثبيت على نظام iOS (Safari):",
      iosStep1: "1. اضغط على زر المشاركة 📤 الموجود بالأسفل في شريط Safari.",
      iosStep2: "2. مرر للأعلى قليلاً واختر \"إضافة إلى الشاشة الرئيسية\" ➕.",
      iosStep3: "3. اضغط على \"إضافة\" بالزاوية العلوية للاعتماد.",
      close: "إغلاق",
      later: "لاحقاً"
    },
    en: {
      title: "Get LinkedIn Authority as a Mobile App 📲",
      desc: "Install on your home screen for rapid access, stable local persistent flow, and streamlined interface without browser clutter.",
      installBtn: "Install Web App ✨",
      installedTitle: "Native Mode Enabled 🟢",
      installedDesc: "You are currently running inside the native standalone secure sandbox framework.",
      iosTitle: "Installation Steps for iOS (Safari):",
      iosStep1: "1. Tap the Share button 📤 in your safari browser's navigation bar.",
      iosStep2: "2. Scroll down and choose \"Add to Home Screen\" ➕.",
      iosStep3: "3. Tap \"Add\" in the top right corner to complete.",
      close: "Close",
      later: "Dismiss"
    },
    de: {
      title: "Holen Sie sich LinkedIn Authority als App 📲",
      desc: "Auf dem Startbildschirm installieren für schnelleren Zugriff und optimierte Benutzeroberfläche ohne Browser-Tabs.",
      installBtn: "Als App installieren ✨",
      installedTitle: "Standalone-Modus Aktiv 🟢",
      installedDesc: "Sie führen die Anwendung derzeit in einem sicheren nativen App-Container aus.",
      iosTitle: "Installationsschritte für iOS (Safari):",
      iosStep1: "1. Tippen Sie auf das Teilen-Symbol 📤 in der Safari-Navigationsleiste.",
      iosStep2: "2. Scrollen Sie nach unten und wählen Sie \"Zum Home-Bildschirm\" ➕.",
      iosStep3: "3. Tippen Sie oben rechts auf \"Hinzufügen\", um den Vorgang abzuschließen.",
      close: "Schließen",
      later: "Später"
    }
  };

  const current = pwaT[lang] || pwaT.en;
  const isAr = lang === 'ar';

  if (isStandalone) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 via-slate-900 to-indigo-950/20 border-b border-emerald-500/15 py-1.5 px-4 text-center text-xs flex items-center justify-center gap-2 select-none">
        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-extrabold text-[10px] uppercase tracking-wider text-emerald-400">{current.installedTitle}:</span>
        <span className="text-[10px] text-slate-400">{current.installedDesc}</span>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="relative z-50">
      {/* Installation Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-b border-indigo-500/20 py-3 px-4 md:px-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-400 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/10 animate-bounce">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className={isAr ? "text-right" : "text-left"}>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5 justify-center sm:justify-start">
              <span>{current.title}</span>
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            </h4>
            <p className="text-[10px] text-slate-400 leading-normal max-w-xl mt-0.5">
              {current.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors cursor-pointer"
          >
            {current.later}
          </button>
          
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-[11px] font-black shadow-lg shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{current.installBtn}</span>
          </button>
        </div>
      </div>

      {/* iOS Safari Custom Instructions Sheet Dialog Backdrop */}
      {showIosGuide && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-500/20">
                <Smartphone className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-sm font-black text-white">{current.iosTitle}</h3>
            </div>

            <div className={`space-y-4 text-xs ${isAr ? "text-right" : "text-left"}`}>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-start gap-3">
                <Share className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-slate-300 font-bold leading-relaxed">{current.iosStep1}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-start gap-3">
                <Plus className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-slate-300 font-bold leading-relaxed">{current.iosStep2}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-slate-300 font-bold leading-relaxed">{current.iosStep3}</p>
              </div>
            </div>

            <button
              onClick={() => { setShowIosGuide(false); setShowPrompt(false); }}
              className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {current.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

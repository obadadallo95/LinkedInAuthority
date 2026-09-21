import React from "react";
import { useAuth } from "../application/AuthContext";
import { Globe, ShieldCheck, Key, GitBranch, Sparkles } from "lucide-react";

export const LoginScreen = ({ 
  lang, 
  onToggleLang 
}: { 
  lang: 'ar' | 'en' | 'de', 
  onToggleLang: (lang?: 'ar'|'en'|'de') => void 
}) => {
  const { signInWithGoogle, signInWithGithub } = useAuth();
  
  const isAr = lang === 'ar';
  const isDe = lang === 'de';

  const title = isAr 
    ? "لينكد إن أوثوريتي" 
    : isDe 
    ? "LinkedIn Authority" 
    : "LinkedIn Authority";

  const subtitle = isAr 
    ? "صناعة حضور رقمي احترافي مؤتمت بالذكاء الاصطناعي من مستودعات كود GitHub." 
    : isDe 
    ? "KI-gestützte LinkedIn-Entwürfe aus begrenzten GitHub-Nachweisen – zur Prüfung und zum manuellen Kopieren."
    : "AI Professional Presence Automation from GitHub Codebases.";

  const description = isAr
    ? "حوّل مستودعات GitHub إلى مسودات تقنية قابلة للتحرير للمراجعة والنسخ اليدوي."
    : isDe
    ? "Verwandeln Sie Ihre Repositories in bearbeitbare technische Entwürfe zur manuellen Prüfung und zum Kopieren."
    : "Convert your GitHub repositories into editable technical drafts for review and manual copying.";

  const securityLabel = isAr ? "تأمين وحماية الحساب" : isDe ? "Sicherheit & Identität" : "Security & Identity";
  const securityDesc = isAr
    ? "المصادقة الحالية متاحة عبر Google وGitHub، مع حفظ إعدادات المستخدم ضمن مساحته."
    : isDe
    ? "Die aktuelle Anmeldung erfolgt über Google und GitHub; Benutzereinstellungen werden im eigenen Bereich gespeichert."
    : "Current sign-in uses Google and GitHub; user settings are stored in the user-scoped account area.";

  const googleBtnLabel = isAr ? "متابعة باستخدام Google" : isDe ? "Mit Google anmelden" : "Continue with Google";
  const githubBtnLabel = isAr ? "متابعة باستخدام GitHub" : isDe ? "Mit GitHub anmelden" : "Continue with GitHub";

  return (
    <div 
      className={`min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden ${isAr ? 'font-ar text-right' : 'font-sans text-left'}`} 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Background visual accents */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      {/* Language Selector Header */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button 
          onClick={() => onToggleLang('ar')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${lang === 'ar' ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-900 text-slate-400 border-transparent hover:text-white'}`}
        >
          العربية
        </button>
        <button 
          onClick={() => onToggleLang('en')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${lang === 'en' ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-900 text-slate-400 border-transparent hover:text-white'}`}
        >
          English
        </button>
        <button 
          onClick={() => onToggleLang('de')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${lang === 'de' ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-900 text-slate-400 border-transparent hover:text-white'}`}
        >
          Deutsch
        </button>
      </div>
      
      <div className="w-full max-w-lg bg-slate-900/40 border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        <div className="relative z-10 text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-slate-950 border border-white/5 rounded-2xl flex items-center justify-center mb-5 shadow-inner relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 rounded-2xl" />
            <Sparkles className="w-8 h-8 text-indigo-400 relative z-10" />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
            {title}
          </h1>
          <p className="text-indigo-400 text-xs md:text-sm font-bold max-w-sm mx-auto leading-relaxed uppercase tracking-wider mb-2">
            {isAr ? "مساحة المسودات التقنية الموثقة" : isDe ? "Arbeitsbereich für evidenzbasierte Entwürfe" : "EVIDENCE-BACKED TECHNICAL DRAFTS"}
          </p>
          <p className="text-slate-300 text-sm md:text-base max-w-md mx-auto leading-relaxed font-semibold">
            {subtitle}
          </p>
          <p className="text-slate-450 text-xs max-w-sm mx-auto leading-relaxed mt-2.5 font-medium">
            {description}
          </p>
        </div>

        {/* Informative Governance Panel */}
        <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 mb-8 text-xs text-slate-400 space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-left">
              <span className="font-bold text-slate-300 block mb-0.5">
                {securityLabel}
              </span>
              <span className="text-[11px] leading-relaxed block text-slate-400">
                {securityDesc}
              </span>
            </div>
          </div>
        </div>

        {/* Action button sign-in options */}
        <div className="space-y-3 relative z-10">
          <button 
            onClick={signInWithGithub}
            className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-lg transition-all cursor-pointer transform active:scale-[0.98] text-xs uppercase tracking-wider"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
              <path fill="currentColor" fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span>{githubBtnLabel}</span>
          </button>


          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-slate-900 font-black py-3.5 px-6 rounded-2xl shadow-lg transition-all cursor-pointer transform active:scale-[0.98] text-xs uppercase tracking-wider"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{googleBtnLabel}</span>
          </button>
        </div>

        {/* Legal Consent Text */}
        <div className="text-center text-[10px] text-slate-400 mt-6 leading-relaxed max-w-xs mx-auto relative z-10">
          بالاستمرار في تسجيل الدخول، فإنك توافق على{" "}
          <a href="#" className="text-indigo-400 hover:underline">شروط الخدمة</a>
          {" "}و{" "}
          <a href="#" className="text-indigo-400 hover:underline">سياسة الخصوصية</a>
          {" "}الخاصة بنا.
        </div>
      </div>
    </div>
  );
};

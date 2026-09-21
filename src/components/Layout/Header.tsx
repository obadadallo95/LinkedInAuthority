import React, { useState } from 'react';
import { Sparkles, ChevronDown, GitBranch, Share2, Bell, ShieldCheck, LogOut, MessageSquare, Globe, Zap } from 'lucide-react';
import { t } from '../../constants';
import { useAuth } from '../../application/AuthContext';

interface HeaderProps {
  lang: 'ar' | 'en' | 'de';
  settings: any;
  onToggleLang: (target?: 'en' | 'ar' | 'de') => void;
  onDisconnect?: (platform: 'github' ) => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, settings, onToggleLang, onDisconnect }) => {
  const isAr = lang === 'ar';
  const isDe = lang === 'de';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const { signOut, user } = useAuth();

  const isPro = Boolean(
    settings?.isFounder === true ||
    settings?.plan === 'pro' ||
    settings?.isPaidSubscription === true ||
    settings?.role === 'admin' ||
    settings?.role === 'founder'
  );

  // Active status color states
  const ghConnected = !!settings?.githubUsername;
  const liConnected = false;
  const copy = {
    live: isAr ? '● متصل' : isDe ? '● Verbunden' : '● Connected',
    disconnected: isAr ? '○ غير متصل' : isDe ? '○ Nicht verbunden' : '○ Not connected',
    plan: isAr ? 'نوع الحساب' : isDe ? 'Tarif' : 'Plan',
    founder: isAr ? 'المؤسس (PRO)' : isDe ? 'Founder (PRO)' : 'Founder (PRO)',
    free: isAr ? 'مجاني' : isDe ? 'Kostenlos' : 'Free',
    identity: isAr ? 'مركز الهوية' : isDe ? 'Identitätsbereich' : 'Identity center',
    authorized: isAr ? 'جلسة موثقة' : isDe ? 'Autorisierte Sitzung' : 'Authorized session',
    disconnect: isAr ? 'فصل GitHub' : isDe ? 'GitHub trennen' : 'Disconnect GitHub',
    signOut: isAr ? 'تسجيل الخروج' : isDe ? 'Abmelden' : 'Sign out',
  };

  return (
    <header className="h-16 sm:h-16 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 glass-panel backdrop-blur-2xl z-[300] sticky top-0 shadow-sm">
      
      {/* Brand logo (Elegant custom CSS-crafted Logo) */}
      <div className="flex items-center gap-2 sm:gap-3 group/logo cursor-pointer select-none">
        <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-sky-400 rounded-xl blur-md opacity-30 group-hover/logo:opacity-50 transition-opacity duration-500" />
          
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border border-white/10 rounded-xl flex items-center justify-center shadow-inner overflow-hidden">
            <img 
              src="/logo.png" 
              className="w-full h-full object-contain p-1 rounded-xl"
              alt="LinkedIn Authority Logo"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            
            <div className="hidden absolute inset-0 flex flex-col items-center justify-center -space-y-0.5">
              <div className="absolute top-0 right-0 w-4 h-4 bg-purple-500/20 rounded-full blur-sm" />
              <div className="absolute bottom-0 left-0 w-4 h-4 bg-teal-400/15 rounded-full blur-sm" />
              <div className="relative flex flex-col items-center justify-center -space-y-0.5">
                <div className="flex items-end gap-0.5 h-3">
                  <div className="w-1 h-1.5 bg-indigo-400 rounded-sm" />
                  <div className="w-1 h-3 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-sm" />
                  <div className="w-1 h-1.5 bg-indigo-400 rounded-sm" />
                </div>
                <div className="w-4 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-sm flex items-center justify-between px-0.5">
                  <div className="w-0.5 h-0.5 bg-white rounded-full opacity-75" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={isAr ? "text-right" : "text-left"}>
          <h1 className="text-[11px] sm:text-sm md:text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-none group-hover/logo:text-indigo-200 transition-colors">
            <span>LinkedIn Authority</span>
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-50"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-indigo-500"></span>
            </span>
            {isPro && (
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-indigo-400/25 text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded-full font-black tracking-wider shadow-sm shadow-indigo-500/10 shrink-0">
                {settings?.isFounder ? 'FOUNDER' : 'PRO'}
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Action panel (Language + User Dropdown) */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        
        {/* Modern & Premium Language Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setLangDropdownOpen(!langDropdownOpen);
              setDropdownOpen(false); // close user session profile dropdown if open
            }}
            className="px-2 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-white/5 hover:border-indigo-500/30 transition-all duration-200 flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm relative group hover:scale-[1.03] select-none shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform duration-300 shrink-0 hidden sm:inline" />
            <span className="text-[11px] sm:text-[11.5px] font-extrabold tracking-wide hidden sm:inline select-none">
              {lang === 'ar' ? '💚🤍🖤 العربية' : lang === 'en' ? '🇬🇧 English' : '🇩🇪 Deutsch'}
            </span>
            <span className="text-[11px] font-extrabold tracking-wide sm:hidden select-none">
              {lang === 'ar' ? 'العربية' : lang === 'en' ? 'EN' : 'DE'}
            </span>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform duration-200 shrink-0" style={{ transform: langDropdownOpen ? 'rotate(180deg)' : 'none' }} />
          </button>

          {langDropdownOpen && (
            <div className={`absolute top-[110%] mt-2 w-48 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 p-1.5 shadow-2xl z-[9999] animate-in fade-in slide-in-from-top-2 duration-150 space-y-1
              ${isAr ? 'left-0' : 'right-0'}
            `}>
              <button 
                onClick={() => { onToggleLang('ar'); setLangDropdownOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-all text-right ${lang === 'ar' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-350 hover:bg-white/5'}`}
              >
                <span>العربية</span>
                <span className="text-[11px]">💚🤍🖤</span>
              </button>
              <button 
                onClick={() => { onToggleLang('en'); setLangDropdownOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-all text-left ${lang === 'en' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-350 hover:bg-white/5'}`}
              >
                <span>English</span>
                <span className="text-sm">🇬🇧</span>
              </button>
              <button 
                onClick={() => { onToggleLang('de'); setLangDropdownOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-all text-left ${lang === 'de' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-350 hover:bg-white/5'}`}
              >
                <span>Deutsch</span>
                <span className="text-sm">🇩🇪</span>
              </button>
            </div>
          )}
        </div>

        {/* Interactive User Dropdown Area */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 sm:gap-2 bg-slate-850 hover:bg-slate-800 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-white/5 transition-all text-left cursor-pointer shrink-0"
          >
            {settings?.githubProfile?.avatar_url ? (
              <img 
                src={settings.githubProfile.avatar_url} 
                className="w-7 h-7 rounded-full border border-indigo-500/40 shrink-0" 
                alt="github avatar"
                referrerPolicy="no-referrer"
              />
            ) : user?.photoURL ? (
              <img 
                src={user.photoURL} 
                className="w-7 h-7 rounded-full border border-indigo-500/40 shrink-0" 
                alt="user avatar"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0">
                U
              </div>
            )}
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-100 leading-tight">
                {settings?.githubProfile?.name || settings?.githubUsername || user?.displayName || 'Developer'}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">
                {liConnected ? copy.live : ghConnected ? copy.live : copy.disconnected}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 transition-transform duration-200 shrink-0" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
          </button>

          {dropdownOpen && (
            <div className={`absolute top-[110%] mt-2 w-64 bg-slate-800 rounded-2xl border border-white/10 p-3 shadow-2xl z-[9999]
              ${isAr ? 'left-0' : 'right-0'}
            `}>
              <div className="px-2 py-1.5 border-b border-white/5 mb-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{copy.identity}</p>
                <p className="text-xs font-black text-slate-200 mt-0.5">
                  {settings?.githubProfile?.name || settings?.githubUsername || user?.displayName || copy.authorized}
                </p>
              </div>

              {/* Status information */}
              <div className="space-y-1 pb-2 border-b border-white/5 mb-2">
                <div className="flex items-center justify-between text-[11px] p-2 hover:bg-white/5 rounded-lg text-slate-300">
                  <span className="flex items-center gap-2"><GitBranch className="w-3.5 h-3.5 text-slate-400" /> GitHub</span>
                  <span className={ghConnected ? "text-emerald-400 font-bold" : "text-slate-500"}>
                    {ghConnected ? copy.live : copy.disconnected}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] p-2 hover:bg-white/5 rounded-lg text-slate-300">
                  <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-indigo-400" /> {copy.plan}</span>
                  <span className={isPro ? "text-indigo-400 font-bold" : "text-slate-500"}>
                    {settings?.isFounder ? copy.founder : isPro ? 'PRO' : copy.free}
                  </span>
                </div>
              </div>

              {/* Disconnect Shortcuts */}
              <div className="space-y-1">
                {ghConnected && onDisconnect && (
                  <button 
                    onClick={() => { onDisconnect('github'); setDropdownOpen(false); }}
                    className="w-full text-left flex items-center justify-between p-2 hover:bg-rose-500/10 text-rose-300 rounded-lg text-[11px] transition-all cursor-pointer"
                  >
                    <span>{copy.disconnect}</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
                
                <div className="h-px bg-white/5 my-1" />
                <button 
                  onClick={() => { signOut(); setDropdownOpen(false); }}
                  className="w-full text-left flex items-center justify-between p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <span>{copy.signOut}</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

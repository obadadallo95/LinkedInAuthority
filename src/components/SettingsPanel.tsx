import React, { useState, useEffect } from 'react';
import { Settings, GitBranch, Share2, RefreshCw, Check, LogIn, Shield, Terminal, Activity } from 'lucide-react';
import { t } from '../constants';
import { HelpGuides } from './HelpGuides';
import { auth, githubProvider, linkedinProvider, db } from '../infrastructure/firebase/config';
import { linkWithPopup, GithubAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getConnectionLogs, subscribeToLogs, LogEntry } from '../services/githubService';

export const SettingsPanel = ({ 
  lang, settings, handleDisconnect, handleOpenLegal 
}: any) => {
  const isAr = lang === 'ar';
  
  const [testingGh, setTestingGh] = useState(false);
  const [testingLi, setTestingLi] = useState(false);
  const [testLiStatus, setTestLiStatus] = useState<'success' | 'err' | null>(null);

  // Connection logs states
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(getConnectionLogs());

  useEffect(() => {
    const unsubscribe = subscribeToLogs(() => {
      setLogs(getConnectionLogs());
    });
    return () => unsubscribe();
  }, []);

  const updatePermission = async (field: string, value: any) => {
    if (!auth.currentUser) return;
    const settingsRef = doc(db, "users", auth.currentUser.uid, "settings", "current");
    try {
      await setDoc(settingsRef, {
        [field]: value
      }, { merge: true });
    } catch (e) {
      console.error(`Failed to update setting ${field}:`, e);
    }
  };

  const connectGithub = async () => {
    setTestingGh(true);
    if (!auth.currentUser) return;
    
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
        
        alert(isAr ? 'تم ربط حساب GitHub بنجاح!' : 'GitHub account linked successfully!');
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/credential-already-in-use') {
        alert(isAr ? 'هذا الحساب مرتبط بالفعل بمستخدم آخر.' : 'This GitHub account is already linked to another user.');
      } else {
        alert(err.message);
      }
    } finally {
      setTestingGh(false);
    }
  };

  const linkLinkedinAccount = async (e: React.MouseEvent) => {
    e.preventDefault();
    setTestingLi(true);
    setTestLiStatus(null);
    if (!auth.currentUser) return;
    
    try {
      const width = 600;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        "/api/auth/linkedin",
        "linkedin-auth",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      const handleAuthMessage = async (event: MessageEvent) => {
        if (event.data && event.data.type === "LINKEDIN_AUTH_SUCCESS") {
          window.removeEventListener("message", handleAuthMessage);
          const { token, profile } = event.data;

          if (token && auth.currentUser) {
            const settingsRef = doc(db, "users", auth.currentUser.uid, "settings", "current");
            await setDoc(settingsRef, {
              linkedinToken: token,
              linkedinProfile: {
                id: profile.id,
                name: profile.name
              }
            }, { merge: true });

            alert(isAr ? 'تم ربط حساب LinkedIn بنجاح!' : 'LinkedIn account linked successfully!');
            window.location.reload();
          }
        }
      };

      window.addEventListener("message", handleAuthMessage);
    } catch (err: any) {
      console.error("LinkedIn OAuth Error:", err);
      alert(err.message);
      setTestLiStatus('err');
    } finally {
      setTestingLi(false);
    }
  };

  const ghConnected = !!settings?.githubProfile || !!settings?.githubUsername;
  const liConnected = !!settings?.linkedinProfile || !!settings?.linkedinToken;

  // Set default values for permissions if not explicitly stored
  const ghPermission = settings?.githubPermissions || 'public';
  const liPublish = settings?.linkedinPublish !== false;
  const liComment = settings?.linkedinComment === true;
  const liFollow = settings?.linkedinFollow === true;

  return (
    <section className={`flex flex-col gap-6 max-w-4xl mx-auto w-full pb-32 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      <div className="flex items-center gap-3 mb-2 px-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white">{isAr ? 'إعدادات الحساب والربط والأمان' : 'Account, Integration & Security'}</h2>
          <p className="text-[11px] text-slate-400">{isAr ? 'قم بإدارة حساباتك المرتبطة وتخصيص صلاحيات الأمان لمنصتك' : 'Manage connected accounts and customize permissions for complete safety'}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* GitHub Config Card */}
        <div className="rounded-3xl bg-slate-900/50 border border-white/5 p-6 flex flex-col relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                <GitBranch className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">GitHub</h3>
                <span className={`text-[10px] font-bold ${ghConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {ghConnected ? (isAr ? 'متصل بنجاح ✓' : 'Connected ✓') : (isAr ? 'غير متصل' : 'Not Connected')}
                </span>
              </div>
            </div>
            {ghConnected && (
              <button 
                type="button" 
                onClick={() => handleDisconnect("github")}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'فصل القناة' : 'Disconnect'}
              </button>
            )}
          </div>
          
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            {!ghConnected ? (
              <div className="flex flex-col gap-4 py-2">
                <div className="text-center">
                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    {isAr ? 'اربط حساب GitHub الخاص بك بنقرة واحدة لتحليل المستودعات وإنشاء منشورات ممتازة.' : 'Connect your GitHub account with one click to analyze code repositories.'}
                  </p>
                  <button 
                    type="button"
                    onClick={connectGithub}
                    disabled={testingGh}
                    className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    {testingGh ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                    {isAr ? 'ربط حساب GitHub آمن' : 'Connect GitHub Securely'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-white/5 shadow-inner">
                  {settings?.githubProfile?.avatar_url ? (
                    <img src={settings.githubProfile.avatar_url} className="w-12 h-12 rounded-full border border-white/10" alt="GitHub Profile" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-white mb-1">{settings?.githubProfile?.name || settings?.githubProfile?.login || settings?.githubUsername}</div>
                    <div className="text-[11px] text-slate-400 font-medium">@{settings?.githubProfile?.login || settings?.githubUsername}</div>
                  </div>
                </div>

                {/* GitHub Permissions Panel */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-200 uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isAr ? 'صلاحيات نطاق المستودعات' : 'Repository Sync Scope'}</span>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isAr ? 'حدد ما ترغب في جلب بياناته ومزامنته لتطبيقك للحفاظ على خصوصيتك:' : 'Define what repositories the engine is allowed to access and analyze:'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updatePermission('githubPermissions', 'public')}
                      className={`py-2 px-3 rounded-xl text-[10px] font-black transition-all border ${
                        ghPermission === 'public'
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isAr ? 'المستودعات العامة فقط' : 'Public Repos Only'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePermission('githubPermissions', 'all')}
                      className={`py-2 px-3 rounded-xl text-[10px] font-black transition-all border ${
                        ghPermission === 'all'
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isAr ? 'كافة المستودعات (عامة + خاصة)' : 'All Repos (Public & Private)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Logs Toggle */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <button
                type="button"
                onClick={() => setShowLogs(!showLogs)}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/40 hover:bg-slate-950/70 border border-white/5 hover:border-white/10 text-[10px] font-bold text-slate-350 flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  {isAr ? 'سجل الاتصالات السحابي' : 'Show Sync Logs'}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-900 rounded text-[9px] text-indigo-300 border border-indigo-500/20 font-mono">
                  {showLogs ? (isAr ? 'إخفاء' : 'HIDE') : (isAr ? 'عرض' : 'SHOW')}
                </span>
              </button>
              
              {showLogs && (
                <div className="bg-slate-950 border border-white/5 rounded-2xl p-3 max-h-40 overflow-y-auto custom-scrollbar space-y-2 text-left">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-400" /> {isAr ? 'سجل المزامنة الأخير' : 'Sync Feed'}
                    </span>
                  </div>
                  
                  {logs.length === 0 ? (
                    <div className="text-center py-4 text-slate-600 text-[10px]">
                      {isAr ? 'لا توجد سجلات حالياً.' : 'No connection logs yet.'}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {logs.slice(0, 5).map((log, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-900/50 border border-white/5 text-[9px] leading-relaxed">
                          <div className="flex items-center justify-between text-slate-500">
                            <span>{log.action}</span>
                            <span className="font-mono text-[8px]">{log.timestamp.split('T')[1]?.slice(0, 5)}</span>
                          </div>
                          <div className="font-bold text-slate-300 mt-0.5">{log.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LinkedIn Config Card */}
        <div className="rounded-3xl bg-slate-900/50 border border-white/5 p-6 flex flex-col relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Share2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">LinkedIn</h3>
                <span className={`text-[10px] font-bold ${liConnected ? 'text-blue-400' : 'text-slate-500'}`}>
                  {liConnected ? (isAr ? 'متصل بنجاح ✓' : 'Connected ✓') : (isAr ? 'غير متصل' : 'Not Connected')}
                </span>
              </div>
            </div>
            {liConnected && (
              <button 
                type="button" 
                onClick={() => handleDisconnect("linkedin")}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'فصل الحساب' : 'Disconnect'}
              </button>
            )}
          </div>
          
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            {!liConnected ? (
              <div className="py-2 text-center">
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                  {isAr ? 'اربط حسابك المهني لبدء نشر منشوراتك المكتوبة من الذكاء الاصطناعي مباشرة.' : 'Connect your professional account to publish generated posts directly.'}
                </p>
                <button 
                  type="button" 
                  onClick={linkLinkedinAccount}
                  disabled={testingLi}
                  className="px-6 py-3 rounded-xl text-[11px] font-black bg-[#0077b5] hover:bg-[#006396] text-white flex items-center gap-2 transition-all cursor-pointer w-full justify-center shadow-lg shadow-blue-600/10"
                >
                  {testingLi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {isAr ? 'تسجيل الدخول وربط LinkedIn' : 'Log in & Link LinkedIn'}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-white/5 shadow-inner">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/25">
                    <Share2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-white mb-1">{settings?.linkedinProfile?.name || 'LinkedIn Member'}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                      {isAr ? 'مخول للنشر' : 'Authorized'}
                    </span>
                  </div>
                </div>

                {/* LinkedIn Permissions switches */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-200 uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isAr ? 'صلاحيات النشر والتفاعل المهني' : 'B2B Interaction Permissions'}</span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isAr ? 'قم بالتحكم في العمليات المسموح للتطبيق إجراؤها لضمان كامل الأمان والخصوصية لقناتك المهنية:' : 'Explicitly grant permissions for what the automation engine can perform:'}
                  </p>

                  <div className="space-y-3.5 pt-1">
                    {/* Publish toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10.5px] font-bold text-white">{isAr ? 'نشر المنشورات على الخط الزمني' : 'Publish Posts on Timeline'}</span>
                        <span className="text-[9px] text-slate-500">{isAr ? 'نشر التحليلات والملخصات المقررة' : 'Publish synthesized updates'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updatePermission('linkedinPublish', !liPublish)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          liPublish ? 'bg-indigo-600' : 'bg-slate-800'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          liPublish ? (isAr ? '-translate-x-4' : 'translate-x-4') : 'translate-x-4'
                        }`} />
                      </button>
                    </div>

                    {/* Comment toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10.5px] font-bold text-white">{isAr ? 'كتابة الردود والتعليقات التلقائية' : 'Write AI Comments'}</span>
                        <span className="text-[9px] text-slate-500">{isAr ? 'التعليق على المنشورات ذات الصلة لزيادة الانتشار' : 'Comment on relevant content to boost reach'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updatePermission('linkedinComment', !liComment)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          liComment ? 'bg-indigo-600' : 'bg-slate-800'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          liComment ? (isAr ? '-translate-x-4' : 'translate-x-4') : 'translate-x-4'
                        }`} />
                      </button>
                    </div>

                    {/* Follow toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10.5px] font-bold text-white">{isAr ? 'متابعة الشركات والصفحات المهنية' : 'Auto Follow Pages'}</span>
                        <span className="text-[9px] text-slate-500">{isAr ? 'بناء شبكة علاقات مع صناع القرار تلقائياً' : 'Automated B2B network building'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updatePermission('linkedinFollow', !liFollow)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          liFollow ? 'bg-indigo-600' : 'bg-slate-800'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          liFollow ? (isAr ? '-translate-x-4' : 'translate-x-4') : 'translate-x-4'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {liConnected && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-500">
                <span>{isAr ? 'تم التحقق من الرمز والاتصال المهني نشط.' : 'Connection verified and active.'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <HelpGuides lang={lang} />
      </div>

      <div className="mt-4 bg-slate-900/50 border border-white/5 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] font-bold text-slate-400">
            <button 
              onClick={() => handleOpenLegal('privacy')}
              className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-2 hover:underline decoration-indigo-500/50"
            >
              <span>{isAr ? "سياسة الخصوصية 🛡️" : "Privacy Policy 🛡️"}</span>
            </button>
            <span className="text-slate-700 hidden sm:block">|</span>
            <button 
              onClick={() => handleOpenLegal('terms')}
              className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-2 hover:underline decoration-indigo-500/50"
            >
              <span>{isAr ? "شروط الاستخدام والملكية ⚖️" : "Terms & IP ⚖️"}</span>
            </button>
            <span className="text-slate-700 hidden sm:block">|</span>
            <button 
              onClick={() => handleOpenLegal('developer')}
              className="text-indigo-400 hover:text-purple-400 transition-all cursor-pointer flex items-center gap-2 font-extrabold hover:underline decoration-purple-500/50"
            >
              <span>{isAr ? "عن المطور 👑" : "About Developer 👑"}</span>
            </button>
          </div>
          <div className="text-[10px] text-slate-500 font-medium font-mono text-center mt-4 tracking-tight">
            <span>© 2026 Obada Dallo • </span>
            <a 
              href="https://obadadallo.web.app/"
              target="_blank"
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 transition-colors underline font-semibold decoration-indigo-500/30"
            >
              obadadallo.web.app
            </a>
          </div>
      </div>
    </section>
  );
};

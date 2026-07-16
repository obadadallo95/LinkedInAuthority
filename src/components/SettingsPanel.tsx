import React, { useState, useEffect } from 'react';
import { Settings, GitBranch, Share2, RefreshCw, Check, LogIn, ShieldCheck, Terminal, Activity } from 'lucide-react';
import { t } from '../constants';
import { HelpGuides } from './HelpGuides';
import { auth, githubProvider, linkedinProvider, db } from '../infrastructure/firebase/config';
import { linkWithPopup, signInWithPopup, GithubAuthProvider, OAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { checkTokenScopes, getConnectionLogs, subscribeToLogs, LogEntry } from '../services/githubService';

export const SettingsPanel = ({ 
  lang, settings, setSettingsInput, inputs, handleSaveSettings, handleDisconnect, handleOpenLegal 
}: any) => {
  const isAr = lang === 'ar';
  
  const [testingGh, setTestingGh] = useState(false);
  const [testingLi, setTestingLi] = useState(false);
  const [testGhStatus, setTestGhStatus] = useState<'success' | 'err' | null>(null);
  const [testLiStatus, setTestLiStatus] = useState<'success' | 'err' | null>(null);

  // New troubleshooting & validation states
  const [showLogs, setShowLogs] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; scopes: string[]; hasRepoScope: boolean; error: string | null } | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(getConnectionLogs());

  useEffect(() => {
    const unsubscribe = subscribeToLogs(() => {
      setLogs(getConnectionLogs());
    });
    return () => unsubscribe();
  }, []);

  const checkTokenPermissions = async () => {
    setCheckingPermissions(true);
    setValidationResult(null);
    const tokenToCheck = inputs.ghTokenInput || settings?.githubToken;
    try {
      const result = await checkTokenScopes(tokenToCheck);
      setValidationResult(result);
    } catch (err: any) {
      setValidationResult({
        valid: false,
        scopes: [],
        hasRepoScope: false,
        error: err.message || err
      });
    } finally {
      setCheckingPermissions(false);
    }
  };

  const connectGithub = async () => {
    if (!auth.currentUser) return;
    setTestingGh(true);
    
    try {
      const result = await linkWithPopup(auth.currentUser, githubProvider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token && result.user) {
        const userRes = await fetch('https://api.github.com/user', {
          headers: { Authorization: `token ${token}` }
        });
        const userData = await userRes.json();
        
        setSettingsInput('ghUsername', userData.login);
        setSettingsInput('ghToken', token);
        
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

  const testGithubConnection = async (e: React.MouseEvent) => {
    e.preventDefault();
    setTestingGh(true);
    setTestGhStatus(null);
    try {
      await handleSaveSettings(e as any);
      
      // Perform a test API call to verify the token/username
      if (inputs.ghUsernameInput) {
        const res = await fetch(`https://api.github.com/users/${inputs.ghUsernameInput}`);
        if (res.ok) {
           setTestGhStatus('success');
        } else {
           setTestGhStatus('err');
        }
      } else {
        setTestGhStatus('err');
      }
    } catch {
      setTestGhStatus('err');
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
      const result = await linkWithPopup(auth.currentUser, linkedinProvider);
      const credential = OAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token && result.user) {
        // Fetch LinkedIn profile data
        const profileRes = await fetch('https://api.linkedin.com/v2/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = profileRes.ok ? await profileRes.json() : {};
        
        setSettingsInput('liToken', token);
        
        const settingsRef = doc(db, "users", result.user.uid, "settings", "current");
        await setDoc(settingsRef, {
            linkedinToken: token,
            linkedinProfile: {
                id: profileData.id,
                name: profileData.localizedFirstName ? `${profileData.localizedFirstName} ${profileData.localizedLastName}` : 'LinkedIn User'
            }
        }, { merge: true });
        
        alert(isAr ? 'تم ربط حساب LinkedIn بنجاح!' : 'LinkedIn account linked successfully!');
        window.location.reload();
      }
    } catch (err: any) {
      console.error("LinkedIn OAuth Error:", err);
      if (err.code === 'auth/credential-already-in-use') {
        alert(isAr ? 'هذا الحساب مرتبط بالفعل بمستخدم آخر.' : 'This LinkedIn account is already linked to another user.');
      } else {
        alert(err.message);
      }
      setTestLiStatus('err');
    } finally {
      setTestingLi(false);
    }
  };

  const ghConnected = !!settings?.githubProfile || !!settings?.githubUsername;
  const liConnected = !!settings?.linkedinProfile || !!settings?.linkedinToken || !!inputs?.liTokenInput;

  return (
    <section className={`flex flex-col gap-6 max-w-4xl mx-auto w-full pb-32 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      <div className="flex items-center gap-3 mb-2 px-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white">{isAr ? 'إعدادات الحساب والربط' : 'Account & Integrations'}</h2>
          <p className="text-[11px] text-slate-400">{isAr ? 'قم بإدارة حساباتك المرتبطة للوصول إلى كافة الميزات' : 'Manage your connected accounts to unlock all features'}</p>
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
                  {ghConnected ? (isAr ? 'متصل' : 'Connected') : (isAr ? 'غير متصل' : 'Not Connected')}
                </span>
              </div>
            </div>
            {ghConnected && (
              <button 
                type="button" 
                onClick={() => handleDisconnect("github")}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold transition-colors cursor-pointer"
              >
                {t[lang].disconnectGh || 'Disconnect'}
              </button>
            )}
          </div>
          
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {!ghConnected ? (
                <div className="flex flex-col gap-4 py-2">
                    <div className="text-center">
                        <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                            {isAr ? 'اربط حساب GitHub الخاص بك بنقرة واحدة (يتطلب تفعيل GitHub OAuth في متغيرات البيئة)' : 'Connect your GitHub account with one click (Requires setting up GitHub OAuth in environment variables).'}
                        </p>
                        <button 
                            type="button"
                            onClick={connectGithub}
                            disabled={testingGh}
                            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                        >
                            {testingGh ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                            {isAr ? 'ربط حساب GitHub' : 'Connect GitHub'}
                        </button>
                        
                        <div className="mt-3 p-3 bg-slate-950/80 rounded-2xl border border-white/5 text-left text-[10px] text-slate-400 space-y-1.5 leading-normal">
                          <div className="font-bold text-slate-300 flex items-center gap-1">
                            💡 {isAr ? 'ملاحظة:' : 'Note:'}
                          </div>
                          <div>
                            {isAr 
                              ? 'عملية الربط هذه آمنة وتستخدم مصادقة Firebase لربط حساب GitHub بحسابك الحالي لاستخراج مستودعاتك.' 
                              : 'This linking process is secure and uses Firebase Auth to connect your GitHub account to your current profile for fetching your repositories.'}
                          </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-white/5 flex-1"></div>
                        <span className="text-[10px] text-slate-500 font-bold">{isAr ? 'أو يدوياً ومباشرة' : 'OR MANUALLY & DIRECTLY'}</span>
                        <div className="h-px bg-white/5 flex-1"></div>
                    </div>

                    <div className="space-y-3">
                        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-[10px] text-amber-300/90 leading-relaxed">
                          💡 {isAr 
                            ? 'لتجنب قيود الطلبات (Rate Limits) وجلب مستودعاتك الحقيقية فوراً، يوصى بشدة بإنشاء Personal Access Token (classic) في GitHub مع تفعيل صلاحية repo وإدخاله بالأسفل.'
                            : 'To avoid public rate limits and fetch your real repos instantly, we highly recommend generating a Personal Access Token (classic) on GitHub with "repo" scope and pasting it below.'}
                        </div>
                        <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">{t[lang].githubUsernameLabel}</label>
                        <input 
                            type="text" 
                            placeholder={t[lang].githubUsernamePlaceholder}
                            value={inputs.ghUsernameInput}
                            onChange={e => setSettingsInput('ghUsername', e.target.value)}
                            className="w-full text-[11px] rounded-xl bg-slate-950 border border-white/5 py-2 px-3 focus:outline-none focus:border-indigo-500 text-white font-medium transition-colors"
                        />
                        </div>
                        <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">{t[lang].githubTokenLabel} (PAT)</label>
                        <input 
                            type="password" 
                            placeholder={t[lang].githubTokenPlaceholder}
                            value={inputs.ghTokenInput}
                            onChange={e => setSettingsInput('ghToken', e.target.value)}
                            className="w-full text-[11px] rounded-xl bg-slate-950 border border-white/5 py-2 px-3 focus:outline-none focus:border-indigo-500 text-white transition-colors"
                        />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button 
                              type="button" 
                              onClick={testGithubConnection}
                              disabled={testingGh || (!inputs.ghUsernameInput && !inputs.ghTokenInput)}
                              className="flex-1 py-2 rounded-xl text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                          >
                              {testingGh ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              <span>{isAr ? 'حفظ واختبار' : 'Save & Test'}</span>
                          </button>

                          <button 
                              type="button" 
                              onClick={checkTokenPermissions}
                              disabled={checkingPermissions || (!inputs.ghTokenInput && !settings?.githubToken)}
                              className="flex-1 py-2 rounded-xl text-[10px] font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                          >
                              {checkingPermissions ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                              <span>{isAr ? 'فحص الصلاحيات' : 'Check Permissions'}</span>
                          </button>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          {testGhStatus === 'success' && <span className="text-[10px] text-emerald-400 flex items-center font-bold gap-1"><Check className="w-3 h-3" /> {isAr ? 'تم الحفظ والاتصال' : 'Saved & Connected'}</span>}
                          {testGhStatus === 'err' && <span className="text-[10px] text-rose-400 flex items-center font-bold">✕ {isAr ? 'خطأ في الاتصال' : 'Connection Error'}</span>}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-white/5 shadow-inner">
                      {settings?.githubProfile?.avatar_url ? (
                          <img src={settings.githubProfile.avatar_url} className="w-12 h-12 rounded-full border border-white/10" alt="GitHub Profile" />
                      ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                               <GitBranch className="w-5 h-5 text-slate-400" />
                          </div>
                      )}
                      <div className="flex-1">
                          <div className="text-[13px] font-bold text-white mb-1">{settings?.githubProfile?.name || settings?.githubProfile?.login || settings?.ghUsername || inputs.ghUsernameInput}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{settings?.githubProfile?.login ? `@${settings.githubProfile.login}` : ''}</div>
                      </div>
                  </div>

                  <button 
                      type="button" 
                      onClick={checkTokenPermissions}
                      disabled={checkingPermissions || !settings?.githubToken}
                      className="w-full py-2.5 rounded-xl text-[10px] font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-350 border border-indigo-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                      {checkingPermissions ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>{isAr ? 'فحص الصلاحيات للرمز المتصل' : 'Check Permissions for Connected Token'}</span>
                  </button>
                </div>
            )}

            {/* Validation Result Area */}
            {validationResult && (
              <div className={`p-3.5 rounded-2xl border text-[10.5px] leading-relaxed space-y-1.5 transition-all ${
                validationResult.valid && validationResult.hasRepoScope
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : validationResult.valid
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                <div className="font-bold flex items-center gap-1.5 text-[11px]">
                  {validationResult.valid && validationResult.hasRepoScope ? '✅' : '⚠️'}
                  <span>
                    {validationResult.valid 
                      ? (isAr ? 'تم التحقق من الرمز بنجاح!' : 'Token Verified Successfully!')
                      : (isAr ? 'فشل التحقق من الرمز!' : 'Token Verification Failed!')}
                  </span>
                </div>
                {validationResult.valid ? (
                  <div className="space-y-1">
                    <div>
                      <strong>{isAr ? 'الصلاحيات المكتشفة:' : 'Detected Scopes:'}</strong>{' '}
                      <code className="bg-slate-950/60 px-1.5 py-0.5 rounded font-mono text-[9.5px] text-white">
                        {validationResult.scopes.length > 0 ? validationResult.scopes.join(', ') : 'none'}
                      </code>
                    </div>
                    <div className="text-[10px] pt-1">
                      {validationResult.hasRepoScope ? (
                        <span className="text-emerald-400 font-medium">
                          ✓ {isAr ? 'تأكيد: صلاحية الوصول للمستودعات "repo" مفعلة بشكل كامل ومكتملة.' : 'Success: Full repository access ("repo" scope) is granted.'}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold">
                          ✕ {isAr ? 'تنبيه: صلاحية الوصول للمستودعات "repo" غير مفعلة! هذا سيسبب أخطاء 403 Forbidden.' : 'Warning: "repo" scope is missing! This will cause 403 Forbidden errors when analyzing private repos.'}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-rose-400 font-medium">
                    {validationResult.error}
                  </div>
                )}
              </div>
            )}

            {/* Connection Logs Toggle */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <button
                type="button"
                onClick={() => setShowLogs(!showLogs)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950/40 hover:bg-slate-950/70 border border-white/5 hover:border-white/10 text-[10.5px] font-bold text-slate-300 flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  {isAr ? 'عرض سجل الاتصالات والشبكة' : 'Show Connection Logs'}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-900 rounded text-[9px] text-indigo-300 border border-indigo-500/20 font-mono">
                  {showLogs ? (isAr ? 'إخفاء' : 'HIDE') : (isAr ? 'عرض' : 'SHOW')}
                </span>
              </button>
              
              {showLogs && (
                <div className="bg-slate-950 border border-white/5 rounded-2xl p-3.5 max-h-56 overflow-y-auto custom-scrollbar space-y-2">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-400" /> {isAr ? 'سجل أحداث API الأخير' : 'Recent API Events'}
                    </span>
                    <span className="text-[8px] text-slate-500 font-medium">
                      {isAr ? 'محدث في الوقت الحقيقي' : 'Real-time feed'}
                    </span>
                  </div>
                  
                  {logs.length === 0 ? (
                    <div className="text-center py-6 text-slate-600 text-[10px]">
                      {isAr ? 'لا توجد سجلات بعد. قم بأي عملية اتصال للبدء.' : 'No connection logs yet. Trigger a repository load or token test to populate.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col gap-1.5 text-[9px] leading-relaxed">
                          <div className="flex items-center justify-between">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                              log.status === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                              log.status === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {log.status}
                            </span>
                            <span className="text-slate-500 font-mono text-[8px]">{log.timestamp}</span>
                          </div>
                          <div className="font-bold text-slate-200">
                            [{log.action}] {log.message}
                          </div>
                          {log.details && (
                            <div className="font-mono text-[8px] text-slate-400 bg-slate-950 p-2 rounded border border-white/5 select-all break-all leading-normal whitespace-pre-wrap">
                              {log.details}
                            </div>
                          )}
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
                  {liConnected ? (isAr ? 'متصل' : 'Connected') : (isAr ? 'غير متصل' : 'Not Connected')}
                </span>
              </div>
            </div>
            {liConnected && (
              <button 
                type="button" 
                onClick={() => handleDisconnect("linkedin")}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold transition-colors cursor-pointer"
              >
                {t[lang].disconnectLi || 'Disconnect'}
              </button>
            )}
          </div>
          
          <div className="space-y-4 flex-1">
            <div>
              <p className="text-[12px] font-bold text-slate-300 mb-2">
                {isAr ? 'ربط حساب لينكدإن الخاص بك' : 'Connect your LinkedIn account'}
              </p>
              <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                {isAr 
                  ? 'سيتم توجيهك إلى لينكدإن لتسجيل الدخول بأمان وتخويل التطبيق للنشر نيابة عنك.' 
                  : 'You will be redirected to LinkedIn to securely log in and authorize the app to post on your behalf.'}
              </p>
              {!liConnected && (
                <button 
                  type="button" 
                  onClick={linkLinkedinAccount}
                  disabled={testingLi}
                  className="px-6 py-3 rounded-xl text-[11px] font-black bg-[#0077b5] hover:bg-[#006396] text-white flex items-center gap-2 transition-all cursor-pointer w-full justify-center"
                >
                  {testingLi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {isAr ? 'تسجيل الدخول باستخدام LinkedIn' : 'Log in with LinkedIn'}
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-2">
              {testLiStatus === 'success' && <span className="text-[10px] text-emerald-400 flex items-center font-bold gap-1"><Check className="w-3 h-3" /> OK</span>}
              {testLiStatus === 'err' && <span className="text-[10px] text-rose-400 flex items-center font-bold">✕ Error</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <button 
          onClick={handleSaveSettings}
          className="w-full md:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black shadow-xl shadow-indigo-600/20 text-white transition-all transform hover:scale-[1.02] cursor-pointer"
        >
          {t[lang].saveSettingsBtn}
        </button>
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
              Portfolio
            </a>
          </div>
      </div>

    </section>
  );
};

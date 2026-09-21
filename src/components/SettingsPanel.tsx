import React, { useState, useEffect } from 'react';
import { Settings, GitBranch, Share2, RefreshCw, Check, LogIn, Shield, Terminal, Activity, Zap, Crown } from 'lucide-react';
import { t } from '../constants';
import { HelpGuides } from './HelpGuides';
import { auth, githubProvider } from '../infrastructure/firebase/config';
import { loadFirestoreClient } from '../infrastructure/firebase/firestoreClient';
import { linkWithPopup, signInWithCredential, GithubAuthProvider } from 'firebase/auth';
import { addConnectionLog, getConnectionLogs, subscribeToLogs, LogEntry } from '../services/githubService';

export const SettingsPanel = ({ 
  lang, settings, handleDisconnect, handleOpenLegal, handleDeleteAccount
}: any) => {
  const isAr = lang === 'ar';
  const isDe = lang === 'de';
  
  const [testingGh, setTestingGh] = useState(false);
  const [permissionState, setPermissionState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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
    setPermissionState('saving');
    try {
      if (field !== 'githubPermissions' || (value !== 'public' && value !== 'all')) {
        throw new Error('Invalid GitHub access scope');
      }
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/api/integrations/github/scope', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ scope: value }),
      });
      if (!response.ok) throw new Error('GitHub access scope update failed');
      setPermissionState('saved');
      addConnectionLog(
        'github.scope',
        'success',
        isAr
          ? `تم حفظ نطاق الوصول: ${value === 'all' ? 'العامة والخاصة' : 'العامة فقط'}.`
          : isDe
            ? `Repository-Zugriffsbereich gespeichert: ${value === 'all' ? 'öffentlich und privat' : 'nur öffentlich'}.`
            : `Repository access scope saved: ${value === 'all' ? 'public and private' : 'public only'}.`,
      );
      window.setTimeout(() => setPermissionState('idle'), 2200);
    } catch (e) {
      console.error(`Failed to update setting ${field}:`, e);
      setPermissionState('error');
      addConnectionLog(
        'github.scope',
        'error',
        isAr ? 'تعذر حفظ نطاق الوصول إلى المستودعات.' : isDe ? 'Der Repository-Zugriffsbereich konnte nicht gespeichert werden.' : 'Repository access scope could not be saved.',
      );
    }
  };

  const connectGithub = async () => {
    setActionError(null);
    setActionNotice(null);
    setTestingGh(true);
    if (!auth.currentUser) {
      setTestingGh(false);
      addConnectionLog('github.connect', 'error', isAr ? 'يتطلب ربط GitHub جلسة دخول موثقة.' : isDe ? 'Für die GitHub-Verbindung ist eine authentifizierte Sitzung erforderlich.' : 'GitHub connection requires an authenticated session.');
      return;
    }
    
    try {
      let result;
      try {
        result = await linkWithPopup(auth.currentUser, githubProvider);
      } catch (error: any) {
        // If GitHub is already attached to an older Firebase identity, use
        // that identity instead of leaving the user stuck on the current
        // account with a misleading "connected" profile.
        if (error?.code !== 'auth/credential-already-in-use') throw error;
        const existingCredential = GithubAuthProvider.credentialFromError(error);
        if (!existingCredential) throw error;
        result = await signInWithCredential(auth, existingCredential);
      }
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token && result.user) {
        const idToken = await result.user.getIdToken();
        const credentialResponse = await fetch('/api/integrations/github/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ token }),
        });
        if (!credentialResponse.ok) throw new Error('GitHub connection failed');
        const userData = (await credentialResponse.json()).profile;
        const { db, doc, setDoc } = await loadFirestoreClient();
        const settingsRef = doc(db, "users", result.user.uid, "settings", "current");
        await setDoc(settingsRef, {
            githubUsername: userData.login,
            githubProfile: {
                login: userData.login,
                avatar_url: userData.avatar_url,
                name: userData.name
            }
        }, { merge: true });
        addConnectionLog('github.connect', 'success', isAr ? 'تم ربط GitHub عبر الجسر الخادمي الآمن.' : isDe ? 'GitHub wurde über die sichere Serververbindung verbunden.' : 'GitHub connected through the secure server bridge.');
        
        setActionNotice(isAr ? 'تم ربط حساب GitHub بنجاح.' : isDe ? 'GitHub-Konto erfolgreich verbunden.' : 'GitHub account linked successfully.');
        window.location.reload();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/credential-already-in-use') {
        addConnectionLog('github.connect', 'error', isAr ? 'حساب GitHub مرتبط بالفعل بمستخدم آخر.' : isDe ? 'Dieses GitHub-Konto ist bereits mit einem anderen Nutzer verbunden.' : 'This GitHub account is already connected to another user.');
        setActionError(isAr ? 'هذا الحساب مرتبط بالفعل بمستخدم آخر.' : isDe ? 'Dieses GitHub-Konto ist bereits mit einem anderen Nutzer verbunden.' : 'This GitHub account is already linked to another user.');
      } else {
        addConnectionLog('github.connect', 'error', isAr ? 'تعذر إكمال ربط GitHub.' : isDe ? 'Die GitHub-Verbindung konnte nicht abgeschlossen werden.' : 'GitHub connection could not be completed.');
        setActionError(isAr ? 'تعذر إكمال ربط GitHub حالياً. حاول مرة أخرى.' : isDe ? 'Die GitHub-Verbindung konnte nicht abgeschlossen werden. Bitte erneut versuchen.' : 'GitHub connection could not be completed. Try again.');
      }
    } finally {
      setTestingGh(false);
    }
  };



  const ghConnected = !!settings?.githubProfile || !!settings?.githubUsername;

  const exportData = async () => {
    if (!auth.currentUser) return;
    setActionError(null);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/api/account/export', { headers: { Authorization: `Bearer ${idToken}` } });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `linkedin-authority-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setActionNotice(isAr ? 'تم تجهيز ملف تصدير بيانات الحساب للتنزيل.' : isDe ? 'Der Datenexport wurde zum Download vorbereitet.' : 'Your account export is ready to download.');
    } catch (error) {
      console.error('Account export failed:', error);
      setActionError(isAr ? 'تعذر تصدير بيانات الحساب حالياً.' : isDe ? 'Der Datenexport ist derzeit nicht verfügbar.' : 'Account export is temporarily unavailable.');
    }
  };

  // Set default values for permissions if not explicitly stored
  const ghPermission = settings?.githubPermissions || 'public';

  return (
    <section className={`flex flex-col gap-6 max-w-4xl mx-auto w-full pb-32 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      <div className="flex items-center gap-3 mb-2 px-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-black text-white">{isAr ? 'إعدادات الحساب والربط والأمان' : isDe ? 'Konto, Integrationen & Sicherheit' : 'Account, Integration & Security'}</h2>
          <p className="text-[11px] text-slate-400">{isAr ? 'قم بإدارة حساباتك المرتبطة وتخصيص صلاحيات الأمان لمنصتك' : isDe ? 'Verwalten Sie Verbindungen und Sicherheitseinstellungen für Ihren Arbeitsbereich.' : 'Manage connected accounts and customize permissions for complete safety'}</p>
        </div>
      </div>

      {actionNotice && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200" role="status" aria-live="polite">
          <span className="flex-1">{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="text-xs font-bold underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-300">
            {isAr ? 'إخفاء' : isDe ? 'Ausblenden' : 'Dismiss'}
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert" aria-live="assertive">
          <span className="flex-1">{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="text-xs font-bold underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-rose-300">
            {isAr ? 'إخفاء' : isDe ? 'Ausblenden' : 'Dismiss'}
          </button>
        </div>
      )}

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
                  {ghConnected ? (isAr ? 'متصل بنجاح ✓' : isDe ? 'Verbunden ✓' : 'Connected ✓') : (isAr ? 'غير متصل' : isDe ? 'Nicht verbunden' : 'Not Connected')}
                </span>
              </div>
            </div>
            {ghConnected && (
              <button 
                type="button" 
                onClick={() => {
                  addConnectionLog('github.disconnect', 'info', isAr ? 'تم طلب فصل GitHub.' : isDe ? 'Die Trennung von GitHub wurde angefordert.' : 'GitHub disconnect requested.');
                  void handleDisconnect("github");
                }}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'فصل القناة' : isDe ? 'Trennen' : 'Disconnect'}
              </button>
            )}
          </div>
          
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            {!ghConnected ? (
              <div className="flex flex-col gap-4 py-2">
                <div className="text-center">
                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    {isAr ? 'اربط حساب GitHub الخاص بك بنقرة واحدة لتحليل المستودعات وإنشاء مسودات موثقة قابلة للمراجعة.' : isDe ? 'Verbinden Sie Ihr GitHub-Konto, um Repositories zu analysieren und belegte Entwürfe zur Prüfung zu erstellen.' : 'Connect your GitHub account with one click to analyze repositories and create evidence-backed drafts.'}
                  </p>
                  <button 
                    type="button"
                    onClick={connectGithub}
                    disabled={testingGh}
                    className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    {testingGh ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                    {isAr ? 'ربط حساب GitHub آمن' : isDe ? 'GitHub sicher verbinden' : 'Connect GitHub Securely'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-white/5 shadow-inner">
                  {settings?.githubProfile?.avatar_url ? (
                    <img src={settings.githubProfile.avatar_url} className="w-12 h-12 rounded-full border border-white/10" alt={isAr ? 'ملف GitHub' : isDe ? 'GitHub-Profil' : 'GitHub profile'} />
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
                    <span>{isAr ? 'صلاحيات نطاق المستودعات' : isDe ? 'Repository-Zugriffsbereich' : 'Repository Sync Scope'}</span>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isAr ? 'حدد ما ترغب في جلب بياناته ومزامنته لتطبيقك للحفاظ على خصوصيتك:' : isDe ? 'Legen Sie fest, auf welche Repositories die Engine zugreifen und die sie analysieren darf:' : 'Define what repositories the engine is allowed to access and analyze:'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updatePermission('githubPermissions', 'public')}
                      disabled={permissionState === 'saving'}
                      className={`py-2 px-3 rounded-xl text-[10px] font-black transition-all border ${
                        ghPermission === 'public'
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isAr ? 'المستودعات العامة فقط' : isDe ? 'Nur öffentliche Repositories' : 'Public Repos Only'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePermission('githubPermissions', 'all')}
                      disabled={permissionState === 'saving'}
                      className={`py-2 px-3 rounded-xl text-[10px] font-black transition-all border ${
                        ghPermission === 'all'
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isAr ? 'كافة المستودعات (عامة + خاصة)' : isDe ? 'Alle Repositories (öffentlich + privat)' : 'All Repos (Public & Private)'}
                    </button>
                  </div>
                  <p className={`text-[10px] ${permissionState === 'error' ? 'text-rose-300' : permissionState === 'saved' ? 'text-emerald-300' : 'text-slate-500'}`} role="status" aria-live="polite">
                    {permissionState === 'saving'
                      ? (isAr ? 'جاري حفظ نطاق الوصول...' : isDe ? 'Zugriffsbereich wird gespeichert …' : 'Saving access scope…')
                      : permissionState === 'saved'
                        ? (isAr ? 'تم حفظ نطاق الوصول.' : isDe ? 'Zugriffsbereich gespeichert.' : 'Access scope saved.')
                        : permissionState === 'error'
                          ? (isAr ? 'تعذر حفظ نطاق الوصول. حاول مرة أخرى.' : isDe ? 'Zugriffsbereich konnte nicht gespeichert werden. Bitte erneut versuchen.' : 'Access scope could not be saved. Try again.')
                          : ''}
                  </p>
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
                  {isAr ? 'سجل جلسة الاتصال المحلي' : isDe ? 'Lokales Sitzungsprotokoll' : 'Local session log'}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-900 rounded text-[9px] text-indigo-300 border border-indigo-500/20 font-mono">
                  {showLogs ? (isAr ? 'إخفاء' : isDe ? 'AUSBLENDEN' : 'HIDE') : (isAr ? 'عرض' : isDe ? 'ANZEIGEN' : 'SHOW')}
                </span>
              </button>
              
              {showLogs && (
                <div className="bg-slate-950 border border-white/5 rounded-2xl p-3 max-h-40 overflow-y-auto custom-scrollbar space-y-2 text-left">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-400" /> {isAr ? 'آخر أحداث الجلسة' : isDe ? 'Letzte Sitzungsereignisse' : 'Recent session events'}
                    </span>
                  </div>
                  
                  {logs.length === 0 ? (
                    <div className="text-center py-4 text-slate-600 text-[10px]">
                      {isAr ? 'لا توجد سجلات حالياً.' : isDe ? 'Noch keine Verbindungsereignisse.' : 'No connection logs yet.'}
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

        {/* Plan & Entitlements Card */}
        <div className="rounded-3xl bg-slate-900/50 border border-white/5 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-colors">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Zap className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{isAr ? 'خطة الحساب والصلاحيات' : isDe ? 'Konto- und Zugriffsplan' : 'Account & Access Plan'}</h3>
                  <span className={`text-[10px] font-bold ${settings?.isFounder || settings?.plan === 'pro' || settings?.isPaidSubscription ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {settings?.isFounder ? (isAr ? 'عضوية المؤسس (PRO) ✓' : isDe ? 'Founder-Zugriff (PRO) ✓' : 'Founder Access (PRO) ✓') : (settings?.plan === 'pro' || settings?.isPaidSubscription) ? 'PRO Plan ✓' : (isAr ? 'الخطة المجانية (Free)' : isDe ? 'Kostenloser Tarif' : 'Free Tier')}
                  </span>
                </div>
              </div>
              {(settings?.isFounder || settings?.plan === 'pro' || settings?.isPaidSubscription) && (
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-indigo-400/25 text-[9px] px-2.5 py-1 rounded-full font-black tracking-wider shadow-sm">
                  {settings?.isFounder ? 'FOUNDER' : 'PRO'}
                </span>
              )}
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{isAr ? 'معدل الذكاء الاصطناعي:' : isDe ? 'KI-Nutzungslimit:' : 'AI Quota Limit:'}</span>
                  <span className="font-bold text-slate-200">
                  {isAr ? 'حدود الاستخدام تدار على الخادم' : isDe ? 'Serverseitig verwaltete Nutzungslimits' : 'Server-managed usage limits'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{isAr ? 'المسح العميق والأتمتة:' : isDe ? 'Tiefenanalyse und Automatisierung:' : 'Deep intelligence and automation:'}</span>
                <span className="font-bold text-slate-300">{isAr ? 'بحسب صلاحيات الحساب' : isDe ? 'Gemäß Kontoberechtigung' : 'According to account access'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{isAr ? 'معرف الحساب:' : isDe ? 'Konto-UID:' : 'Account UID:'}</span>
                <span className="font-mono text-[10px] text-slate-500">{auth.currentUser?.uid || '—'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {settings?.isFounder 
                ? (isAr ? 'تم تفعيل صلاحيات المؤسس الكاملة لهذا الحساب.' : isDe ? 'Founder-Berechtigungen sind für dieses Konto aktiv.' : 'Founder entitlements are active for this account.')
                : (settings?.plan === 'pro' || settings?.isPaidSubscription)
                ? (isAr ? 'حسابك مفعل بصلاحيات Pro الكاملة.' : isDe ? 'Dein Konto verfügt über vollständigen Pro-Zugriff.' : 'Your account has full Pro access enabled.')
                : (isAr ? 'تُطبّق حدود الاستخدام والصلاحيات على الخادم وفق حسابك.' : isDe ? 'Nutzungslimits und Funktionen werden serverseitig für dein Konto durchgesetzt.' : 'Usage limits and capabilities are enforced server-side for your account.')
              }
            </p>
          </div>
        </div>

      </div>

      <div className="mt-8">
        <HelpGuides lang={lang} />
      </div>

      <div className="mt-4 bg-slate-900/50 border border-white/5 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] font-bold text-slate-400">
            <button onClick={exportData} className="hover:text-indigo-400 transition-colors cursor-pointer hover:underline">
              {isAr ? 'تصدير بياناتي' : isDe ? 'Meine Daten exportieren' : 'Export my data'}
            </button>
            <span className="text-slate-700 hidden sm:block">|</span>
            <button onClick={handleDeleteAccount} className="text-red-400 hover:text-red-300 transition-colors cursor-pointer hover:underline">
              {isAr ? 'حذف الحساب' : isDe ? 'Konto löschen' : 'Delete account'}
            </button>
            <span className="text-slate-700 hidden sm:block">|</span>
            <button 
              onClick={() => handleOpenLegal('privacy')}
              className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-2 hover:underline decoration-indigo-500/50"
            >
              <span>{isAr ? "سياسة الخصوصية 🛡️" : isDe ? "Datenschutz 🛡️" : "Privacy Policy 🛡️"}</span>
            </button>
            <span className="text-slate-700 hidden sm:block">|</span>
            <button 
              onClick={() => handleOpenLegal('terms')}
              className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-2 hover:underline decoration-indigo-500/50"
            >
              <span>{isAr ? "شروط الاستخدام والملكية ⚖️" : isDe ? "Nutzung & IP ⚖️" : "Terms & IP ⚖️"}</span>
            </button>
            <span className="text-slate-700 hidden sm:block">|</span>
            <button 
              onClick={() => handleOpenLegal('developer')}
              className="text-indigo-400 hover:text-purple-400 transition-all cursor-pointer flex items-center gap-2 font-extrabold hover:underline decoration-purple-500/50"
            >
              <span>{isAr ? "عن المطور 👑" : isDe ? "Über den Entwickler 👑" : "About Developer 👑"}</span>
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

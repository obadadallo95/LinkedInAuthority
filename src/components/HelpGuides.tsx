import React from 'react';
import { ShieldAlert, ExternalLink, GitBranch, Terminal, Key } from 'lucide-react';
import { t } from '../constants';

export const HelpGuides = ({ lang }: any) => {
  const isAr = lang === 'ar';
  const isDe = lang === 'de';
  
  return (
    <div className={`w-full max-w-4xl mx-auto space-y-4 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">
        {isAr ? 'دليل الوصول' : 'Access Guides'}
      </h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* GitHub Guide Card */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col gap-3 group hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-[11.5px] text-slate-200">{isAr ? 'ربط GitHub عبر OAuth' : isDe ? 'GitHub-OAuth-Verbindung' : 'GitHub OAuth connection'}</h4>
          </div>
          <div className="text-[10.5px] text-slate-400 leading-relaxed flex-1 space-y-2">
            <p>
              {isAr
                ? 'اربط حساب GitHub من زر الربط الآمن. لا نطلب منك نسخ أو تخزين Personal Access Token في المتصفح.'
                : isDe
                  ? 'Verbinden Sie GitHub über die sichere OAuth-Schaltfläche. Personal Access Tokens gehören weder in den Browser noch in den Client-Speicher.'
                  : 'Connect GitHub from the secure OAuth button. You should never paste or store a Personal Access Token in the browser.'}
            </p>
            <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5">
                <span className="font-bold text-slate-300 block mb-1">
                  {isAr ? 'حدود الوصول:' : isDe ? 'Zugriffsgrenze:' : 'Access boundary:'}
                </span>
              <ul className="list-disc list-inside space-y-1 text-slate-400 ml-1 rtl:mr-1 rtl:ml-0">
                <li>{isAr ? 'المستودعات العامة تعمل دون صلاحية خاصة.' : isDe ? 'Öffentliche Repositories funktionieren ohne private Zugangsdaten.' : 'Public repositories work without a private credential.'}</li>
                <li>{isAr ? 'الوصول الخاص اختياري ويُدار من الخادم.' : isDe ? 'Privater Zugriff ist optional und wird serverseitig verwaltet.' : 'Private access is opt-in and handled server-side.'}</li>
              </ul>
            </div>
          </div>
          <a 
            href="https://github.com/settings/applications"
            target="_blank" 
            rel="noopener noreferrer"
            className="self-start text-[10px] flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
          >
            {isAr ? 'فتح إعدادات GitHub' : isDe ? 'GitHub-Einstellungen öffnen' : 'Open GitHub settings'}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* LinkedIn Guide Card */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col gap-3 group hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-400" />
            <h4 className="font-bold text-[11.5px] text-slate-200">{isAr ? 'حدود المشاركة إلى LinkedIn' : isDe ? 'Grenze für LinkedIn-Freigabe' : 'LinkedIn sharing boundary'}</h4>
          </div>
          <p className="text-[10.5px] text-slate-400 leading-relaxed flex-1">
            {isAr
              ? 'النشر المباشر على LinkedIn غير مطبق في النسخة التجريبية الحالية. راجع المسودة ثم انسخها وشاركها يدوياً.'
              : isDe
                ? 'Direktes LinkedIn-Publishing ist in dieser Beta nicht implementiert. Prüfen Sie den Entwurf, kopieren Sie ihn und teilen Sie ihn manuell.'
                : 'LinkedIn publishing is not implemented in the current beta. Review the draft, copy it, and share it manually.'}
          </p>
          <a 
            href="https://developer.linkedin.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="self-start text-[10px] flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold transition-colors"
          >
            {isAr ? 'بوابة المطورين' : isDe ? 'Entwicklerportal' : 'Developer Portal'}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3 mt-4">
        <ShieldAlert className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-[11px] font-bold text-indigo-300 mb-1">
            {isAr ? 'أمان البيانات' : isDe ? 'Datensicherheit' : 'Data Security'}
          </h4>
          <p className="text-[10.5px] text-indigo-400/70 leading-relaxed">
            {isAr
              ? 'تتم معالجة ربط GitHub عبر OAuth وخادم موثق، وتُخزن بيانات الاعتماد مشفرة في سجل خاص لا يقرأه العميل. لا تُرسل الرموز مع طلبات الذكاء الاصطناعي.'
              : isDe
                ? 'Die GitHub-Verbindung läuft über OAuth und den authentifizierten Server. Zugangsdaten werden verschlüsselt in einem für den Client unzugänglichen Datensatz gespeichert und nie mit KI-Anfragen gesendet.'
                : 'GitHub connection is handled through OAuth and the authenticated server. Credentials are encrypted in a client-inaccessible record and never travel with AI requests.'}
          </p>
        </div>
      </div>
    </div>
  );
};

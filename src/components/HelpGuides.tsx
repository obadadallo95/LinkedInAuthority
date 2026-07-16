import React from 'react';
import { ShieldAlert, ExternalLink, Key, Terminal } from 'lucide-react';
import { t } from '../constants';

export const HelpGuides = ({ lang }: any) => {
  const isAr = lang === 'ar';
  
  return (
    <div className={`w-full max-w-4xl mx-auto space-y-4 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">
        {isAr ? 'دليل الوصول' : 'Access Guides'}
      </h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* GitHub Guide Card */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col gap-3 group hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-[11.5px] text-slate-200">GitHub Personal Access Token</h4>
          </div>
          <div className="text-[10.5px] text-slate-400 leading-relaxed flex-1 space-y-2">
            <p>
              {isAr 
                ? 'تحتاج إلى إنشاء رمز وصول شخصي (PAT) الكلاسيكي (Classic) من إعدادات حسابك في GitHub.' 
                : 'You need to generate a Personal Access Token (Classic) from your GitHub developer settings.'}
            </p>
            <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5">
              <span className="font-bold text-slate-300 block mb-1">
                {isAr ? 'الصلاحيات المطلوبة (Scopes):' : 'Required Scopes:'}
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-400 ml-1 rtl:mr-1 rtl:ml-0">
                <li><code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">repo</code> {isAr ? '(للوصول الكامل للمستودعات الخاصة والعامة)' : '(Full control of private repositories)'}</li>
                <li><code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">read:org</code> {isAr ? '(لقراءة بيانات المنظمة إذا لزم الأمر)' : '(To read org data if needed)'}</li>
              </ul>
            </div>
          </div>
          <a 
            href="https://github.com/settings/tokens/new" 
            target="_blank" 
            rel="noopener noreferrer"
            className="self-start text-[10px] flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
          >
            {isAr ? 'إنشاء رمز وصول (Classic)' : 'Generate Token (Classic)'}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* LinkedIn Guide Card */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col gap-3 group hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-400" />
            <h4 className="font-bold text-[11.5px] text-slate-200">LinkedIn Access Token</h4>
          </div>
          <p className="text-[10.5px] text-slate-400 leading-relaxed flex-1">
            {isAr 
              ? 'قم بإنشاء تطبيق في بوابة مطوري لينكدإن واحصل على رمز وصول (Access Token) للنشر نيابة عنك.' 
              : 'Create an app in the LinkedIn Developer Portal and generate an access token to publish content.'}
          </p>
          <a 
            href="https://developer.linkedin.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="self-start text-[10px] flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold transition-colors"
          >
            {isAr ? 'بوابة المطورين' : 'Developer Portal'}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3 mt-4">
        <ShieldAlert className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-[11px] font-bold text-indigo-300 mb-1">
            {isAr ? 'أمان البيانات' : 'Data Security'}
          </h4>
          <p className="text-[10.5px] text-indigo-400/70 leading-relaxed">
            {isAr 
              ? 'لا يتم تخزين مفاتيحك الخاصة على أي خادم مركزي. يتم حفظها محلياً ومزامنتها بشكل آمن مع حسابك فقط لغرض تنفيذ الطلبات.' 
              : 'Your API keys are never stored on centralized servers. They are saved securely in your personal account data purely for local execution.'}
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Scale, ShieldAlert, BadgeInfo, Zap } from 'lucide-react';

interface TermsOfServiceProps {
  lang: 'ar' | 'en' | 'de';
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const isDe = lang === 'de';

  if (isAr) {
    return (
      <div className="space-y-6 text-right" dir="rtl">
        {/* Intro */}
        <div className="space-y-2 pb-4 border-b border-white/5">
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-400" />
            <span>شروط الخدمة والاتفاقية المهنية للشركات</span>
          </h4>
          <p className="text-xs text-slate-400">آخر تحديث: يوليو 2026</p>
        </div>

        {/* Section 1: Professional Usage Guidelines */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5 justify-start">
            <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>1. إرشادات الاستخدام المهني (B2B)</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            تم تصميم منصة LinkedIn Authority كأداة أتمتة محتوى احترافية للمطورين والشركات. باستخدام هذه المنصة، يلتزم المستخدم بمراعاة شروط وأحكام الاستخدام الرسمية لشبكتي GitHub و LinkedIn. يُحظر تماماً:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pr-2">
            <li>استخدام المنصة لإنشاء أو نشر محتوى مضلل، غير لائق مهنياً، أو يروج لمعلومات كاذبة.</li>
            <li>إساءة استخدام ميزة الجدولة لإرسال رسائل عشوائية أو مكثفة (Spam) تنتهك سياسات LinkedIn الخاصة بمعدلات النشر.</li>
            <li>تحليل مستودعات برمجية غير مصرح للمستخدم بالوصول إليها أو استخدام شفرات برمجية تخضع لاتفاقيات عدم الإفصاح (NDA) دون إذن صريح.</li>
          </ul>
        </div>

        {/* Section 2: AI Liability */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5 justify-start">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>2. إخلاء المسؤولية عن المحتوى المولد بالذكاء الاصطناعي</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            تعتمد المنصة على خوارزميات الذكاء الاصطناعي (Gemini AI) لتحليل الأكواد وتوليد المنشورات. يقر المستخدم بما يلي:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pr-2">
            <li><strong>المسؤولية النهائية:</strong> تقع مراجعة وتدقيق وتأكيد صحة أي محتوى يتم إنشاؤه عبر المنصة قبل نشره على عاتق المستخدم بالكامل.</li>
            <li><strong>النزاهة والموثوقية:</strong> لا نضمن دقة أو ملاءمة أو قانونية النصوص المولدة تلقائياً، والمنصة غير مسؤولة عن أي أضرار مهنية أو قانونية ناتجة عن نشر هذا المحتوى.</li>
            <li><strong>الامتثال للملكية الفكرية:</strong> يتحمل المستخدم مسؤولية التأكد من أن المنشورات الناتجة لا تفصح عن أسرار تجارية أو ملكية فكرية محمية لشركته أو لجهات خارجية.</li>
          </ul>
        </div>

        {/* Section 3: Limitations & SLA */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5 justify-start">
            <BadgeInfo className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>3. حدود الخدمة والاتفاقية (SLA)</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            هذه المنصة حالياً في مرحلتها التجريبية (Beta). يحق لنا تعديل الميزات أو تعليقها مؤقتاً لأغراض الصيانة دون إشعار مسبق. الخدمة تُقدم "كما هي" دون ضمانات متعلقة بمدة استمرار التشغيل أو الأداء المستمر للروابط الخارجية (API Connectors).
          </p>
        </div>
      </div>
    );
  }

  if (isDe) {
    return (
      <div className="space-y-6 text-left">
        {/* Intro */}
        <div className="space-y-2 pb-4 border-b border-white/5">
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-400" />
            <span>Nutzungsbedingungen & Professionelle B2B-SaaS-Vereinbarung</span>
          </h4>
          <p className="text-xs text-slate-400">Letzte Aktualisierung: Juli 2026</p>
        </div>

        {/* Section 1: Professional Usage Guidelines */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>1. Richtlinien für die professionelle B2B-Nutzung</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            Die LinkedIn Authority Plattform ist als professionelles Content-Automatisierungstool für Software-Entwickler und Unternehmen konzipiert. Durch die Nutzung erklären Sie sich mit den Nutzungsbedingungen von GitHub und LinkedIn einverstanden. Folgendes ist streng untersagt:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
            <li>Nutzung der Plattform zur Erstellung irreführender, diffamierender oder unprofessioneller Inhalte.</li>
            <li>Missbrauch der Scheduling-Funktion zum Spamming oder zur Verletzung der Veröffentlichungsrichtlinien von LinkedIn.</li>
            <li>Analysieren von privaten Repositories ohne explizite Zugriffsberechtigungen oder Verletzung von Geheimhaltungsvereinbarungen (NDA).</li>
          </ul>
        </div>

        {/* Section 2: AI Liability */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>2. Haftungsausschluss für KI-generierte Inhalte</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            Die Plattform nutzt künstliche Intelligenz (Gemini AI), um Codebasen zu analysieren und Beiträge zu entwerfen. Der Nutzer nimmt Folgendes zur Kenntnis:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
            <li><strong>Endabnahmeverantwortung:</strong> Die vollständige Überprüfung und Freigabe aller automatisch generierten Beiträge vor der Veröffentlichung liegt ausschließlich in der Verantwortung des Nutzers.</li>
            <li><strong>Gewährleistungsausschluss:</strong> Wir garantieren nicht die Richtigkeit, Eignung oder Legalität der erzeugten Texte. Es besteht keine Haftung für berufsbezogene oder rechtliche Schäden.</li>
            <li><strong>Schutz des geistigen Eigentums:</strong> Der Nutzer muss sicherstellen, dass keine geschäftskritischen Geheimnisse oder patentierten Quellcode-Fragmente ungewollt veröffentlicht werden.</li>
          </ul>
        </div>

        {/* Section 3: Limitations & SLA */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
            <BadgeInfo className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>3. Service-Limits & SLA</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            Diese Anwendung befindet sich in der Beta-Phase. Wir behalten uns das Recht vor, Features ohne vorherige Ankündigung anzupassen oder vorübergehend für Wartungsarbeiten auszusetzen. Der Service wird ohne Mängelgewähr bereitgestellt.
          </p>
        </div>
      </div>
    );
  }

  // English (Default)
  return (
    <div className="space-y-6 text-left">
      {/* Intro */}
      <div className="space-y-2 pb-4 border-b border-white/5">
        <h4 className="text-sm font-black text-white flex items-center gap-2">
          <Scale className="w-4 h-4 text-indigo-400" />
          <span>Terms of Service & Professional B2B SaaS Agreement</span>
        </h4>
        <p className="text-xs text-slate-400">Last updated: July 2026</p>
      </div>

      {/* Section 1: Professional Usage Guidelines */}
      <div className="space-y-3">
        <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>1. Professional B2B Usage Guidelines</span>
        </h5>
        <p className="text-xs text-slate-300 leading-relaxed">
          LinkedIn Authority Engine is designed as an automated professional branding and content generation platform for technical leaders, developers, and enterprises. By using the platform, users agree to align strictly with LinkedIn's Professional Community Policies and GitHub's Developer Guidelines. It is strictly prohibited to:
        </p>
        <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
          <li>Generate, schedule, or publish misleading, offensive, or copyright-infringing professional materials.</li>
          <li>Incorporate spamming techniques or violate API request rate limits defined by LinkedIn or GitHub.</li>
          <li>Analyze repositories or parse code structures without authorized access or in violation of existing Non-Disclosure Agreements (NDAs).</li>
        </ul>
      </div>

      {/* Section 2: AI Liability */}
      <div className="space-y-3">
        <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>2. AI Content Generation Liability & Disclaimer</span>
        </h5>
        <p className="text-xs text-slate-300 leading-relaxed">
          Our integrated AI models (Gemini AI) are trained to suggest, summarize, and draft professional updates based on repository files. Users explicitly acknowledge and agree to the following terms:
        </p>
        <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
          <li><strong>Review and Approval:</strong> The user retains sole, final responsibility for checking, validating, and editing AI-drafted content before authorizing its publication.</li>
          <li><strong>No Warranties:</strong> LinkedIn Authority Engine provides no guarantees concerning the absolute factual correctness, professional suitability, or legal compliance of AI outputs.</li>
          <li><strong>IP Protection:</strong> The user must ensure that AI summaries do not inadvertently leak confidential source code, trade secrets, or proprietary enterprise methodologies to public feeds.</li>
        </ul>
      </div>

      {/* Section 3: Limitations & SLA */}
      <div className="space-y-3">
        <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
          <BadgeInfo className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>3. Service Limitations & Beta SLA</span>
        </h5>
        <p className="text-xs text-slate-300 leading-relaxed">
          The service is provided on an "as is" and "as available" basis during our beta release tier. We make no commitments regarding system uptime or continuous API integrations. We reserve the right to limit repository scopes, query budgets, or suspend accounts for misuse.
        </p>
      </div>
    </div>
  );
};

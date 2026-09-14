import React from 'react';
import { ShieldCheck, EyeOff, UserCheck, RefreshCw, KeyRound } from 'lucide-react';

interface PrivacyPageProps {
  lang: 'ar' | 'en' | 'de';
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const isDe = lang === 'de';

  if (isAr) {
    return (
      <div className="space-y-6 text-right" dir="rtl">
        {/* Intro */}
        <div className="space-y-2 pb-4 border-b border-white/5">
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>سياسة الخصوصية وحماية البيانات والامتثال الأوروبي</span>
          </h4>
          <p className="text-xs text-slate-400">آخر تحديث: يوليو 2026</p>
        </div>

        {/* Section 1: Code Access Policy */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5 justify-start">
            <EyeOff className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>1. سياسة الوصول إلى مستودعات الأكواد (قراءة فقط)</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            نحن نلتزم بسياسة صارمة لحماية شفرتك المصدرية. عندما تقوم بربط حساب GitHub الخاص بك:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pr-2">
            <li>تنحصر الصلاحيات المطلوبة في قراءة البيانات العامة والملفات التعريفية للمشاريع فقط.</li>
            <li><strong>لا يتم حفظ الأكواد:</strong> لا نقوم بنسخ أو تخزين أو الاحتفاظ بأي شفرة برمجية على الإطلاق في خوادمنا أو قواعد بياناتنا. تتم معالجة محتوى الملفات بشكل لحظي لتوليد مسودات المنشورات ثم إزالتها فوراً من الذاكرة العشوائية المؤقتة.</li>
          </ul>
        </div>

        {/* Section 2: Tokens Handling */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5 justify-start">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>2. تشفير وإدارة الرموز الأمنية (Tokens)</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            هذه نسخة تجريبية نشطة. تبقى أسرار Gemini على الخادم، لكن تُحفظ رموز GitHub حالياً ضمن إعدادات المستخدم لدعم التدفق المصادق عليه الحالي؛ ولا يمثل ذلك خزنة رموز إنتاجية مخصصة.
          </p>
        </div>

        {/* Section 3: GDPR Compliance & Deletion */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5 justify-start">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>3. الامتثال للائحة حماية البيانات العامة (GDPR) وحق الإلغاء</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            هذه نسخة تجريبية نشطة ولا تدّعي حالياً امتثالاً كاملاً للـ GDPR أو محواً كاملاً من كل مجموعات البيانات:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pr-2">
            <li><strong>حالة الحذف:</strong> لا يضمن زر الحذف الحالي إزالة البيانات من كل المجموعات بعد. يجب التحقق من التنفيذ قبل الاعتماد عليه كمحو كامل.</li>
            <li><strong>حالة النسخة التجريبية:</strong> ما زالت سياسات الاحتفاظ وطلبات الخصوصية الشاملة قيد التنفيذ والتحقق.</li>
          </ul>
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
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Datenschutzrichtlinie & DSGVO-Konformität</span>
          </h4>
          <p className="text-xs text-slate-400">Letzte Aktualisierung: Juli 2026</p>
        </div>

        {/* Section 1: Code Access Policy */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>1. Richtlinie für den Repository-Zugriff (Read-Only)</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            Der Schutz Ihres Quellcodes hat für uns oberste Priorität. Bei der Verknüpfung Ihres GitHub-Kontos gilt:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
            <li>Der Zugriff beschränkt sich ausschließlich auf das Lesen von Metadaten und Strukturdateien, um Projekt-Milestones zu verstehen.</li>
            <li><strong>Keine Speicherung von Code:</strong> Wir spiegeln, speichern oder cachen niemals Ihren Quellcode auf unseren Servern. Die Verarbeitung erfolgt rein flüchtig im RAM zur Inhaltserstellung.</li>
          </ul>
        </div>

        {/* Section 2: Tokens Handling */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>2. Token-Verwaltung und Verschlüsselung</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            Dies ist eine aktive Beta. Gemini-Schlüssel bleiben auf dem Server, GitHub-Integrationstoken werden für den aktuellen authentifizierten Client-Ablauf jedoch in den Benutzereinstellungen gespeichert; dies ist keine dedizierte Produktions-Token-Vault.
          </p>
        </div>

        {/* Section 3: GDPR Compliance & Deletion */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>3. DSGVO-Rechte & EU-Widerrufsrecht</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            Dies ist eine aktive Beta und beansprucht derzeit weder vollständige DSGVO-Konformität noch vollständige Löschung aus jeder Datensammlung:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
            <li><strong>Löschstatus:</strong> Die aktuelle Löschfunktion garantiert noch nicht die Entfernung aus jeder Sammlung. Prüfen Sie die Implementierung vor einer vollständigen Löschung.</li>
            <li><strong>Beta-Status:</strong> Umfassende Aufbewahrungs- und Datenschutzprozesse sind noch in Arbeit und müssen noch verifiziert werden.</li>
          </ul>
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
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Privacy Policy, Data Protection & Regulatory Compliance</span>
        </h4>
        <p className="text-xs text-slate-400">Last updated: July 2026</p>
      </div>

      {/* Section 1: Code Access Policy */}
      <div className="space-y-3">
        <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
          <EyeOff className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>1. Repository Read-Only Access & Code Retention Policy</span>
        </h5>
        <p className="text-xs text-slate-300 leading-relaxed">
          This active beta may persist repository-derived context and drafts. Review the current implementation before relying on it for a zero-retention guarantee:
        </p>
        <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
          <li>The platform accesses files and metadata exclusively in read-only mode to understand release tags, language breakdowns, and project milestones.</li>
          <li><strong>Processing status:</strong> Repository content is processed for analysis and generation, while derived context and drafts may be persisted by the application.</li>
        </ul>
      </div>

      {/* Section 2: Tokens Handling */}
      <div className="space-y-3">
        <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>2. Authentication Token Security & Encryption Standards</span>
        </h5>
        <p className="text-xs text-slate-300 leading-relaxed">
          This is an active beta. Gemini secrets stay server-side, but GitHub integration tokens are currently stored in the user's settings for the existing authenticated client flow. This is a known limitation, not a dedicated production token vault.
        </p>
      </div>

      {/* Section 3: GDPR Compliance & Deletion */}
      <div className="space-y-3">
        <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>3. GDPR Rights (Right to Erasure) & EU Withdrawal Rights</span>
        </h5>
        <p className="text-xs text-slate-300 leading-relaxed">
          This beta does not claim complete GDPR compliance or complete erasure across every stored collection. The current delete action should be treated as incomplete until the remaining data paths are implemented and verified:
        </p>
        <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
          <li><strong>Deletion status:</strong> The current delete action does not yet guarantee removal from every collection or zero residual retention. Review the implementation before relying on it for complete erasure.</li>
          <li><strong>Beta status:</strong> Comprehensive retention and privacy-request workflows remain to be implemented and verified.</li>
        </ul>
      </div>
    </div>
  );
};

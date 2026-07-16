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
            تُخزن رموز الوصول (OAuth Tokens) الخاصة بحسابي LinkedIn و GitHub في بيئة قاعدة بيانات مشفرة بالكامل ومعزولة. لا يتم تمرير هذه الرموز أو كشفها لأي طرف ثالث، وتُستخدم حصرياً لإرسال طلبات النشر المعتمدة من قبلك بشكل مباشر.
          </p>
        </div>

        {/* Section 3: GDPR Compliance & Deletion */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5 justify-start">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>3. الامتثال للائحة حماية البيانات العامة (GDPR) وحق الإلغاء</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            نحن نضمن للمستخدمين الأوروبيين والعالميين كافة حقوقهم بموجب قوانين الخصوصية، بما في ذلك:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pr-2">
            <li><strong>الحق في النسيان (حق المحو):</strong> يمكنك في أي وقت حذف حسابك وكافة بياناتك المسجلة، بما في ذلك المنشورات والرموز الأمنية، بضغطة زر واحدة من خلال خيار "منطقة الخطر" في صفحة الإعدادات، مما يزيل كافة سجلاتك نهائياً من خوادمنا.</li>
            <li><strong>حق الانسحاب والعدول (EU Withdrawal):</strong> للمستخدمين في الاتحاد الأوروبي الحق الكامل في إلغاء وتجميد حساباتهم واسترجاع معلوماتهم المترابطة دون أي شروط معقدة.</li>
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
            Sämtliche OAuth-Zugriffstoken für GitHub und LinkedIn werden unter Verwendung moderner Verschlüsselungsstandards in einer isolierten Datenbankumgebung gesichert. Sie werden niemals an Dritte weitergegeben.
          </p>
        </div>

        {/* Section 3: GDPR Compliance & Deletion */}
        <div className="space-y-3">
          <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>3. DSGVO-Rechte & EU-Widerrufsrecht</span>
          </h5>
          <p className="text-xs text-slate-300 leading-relaxed">
            Wir erfüllen alle datenschutzrechtlichen Anforderungen der Europäischen Union:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
            <li><strong>Recht auf Vergessenwerden (Löschung):</strong> Über die Schaltfläche "Konto löschen" im Einstellungsbereich können Sie Ihr Konto sowie alle Posts, Konfigurationen und Token augenblicklich und unwiderruflich von unseren Systemen entfernen.</li>
            <li><strong>EU-Widerrufsrecht:</strong> Nutzer aus der EU haben ein gesetzliches Widerrufsrecht, das die sofortige Löschung erhobener Verknüpfungen und Daten ohne Angabe von Gründen ermöglicht.</li>
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
          We maintain a zero-retention security model for our users' proprietary intellectual property. When authorized via GitHub OAuth:
        </p>
        <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
          <li>The platform accesses files and metadata exclusively in read-only mode to understand release tags, language breakdowns, and project milestones.</li>
          <li><strong>No Code Caching:</strong> Your proprietary source code is never cached, stored, indexed, or saved to any database on our side. It is parsed strictly on-the-fly inside ephemeral memory enclaves and discarded immediately upon draft synthesis.</li>
        </ul>
      </div>

      {/* Section 2: Tokens Handling */}
      <div className="space-y-3">
        <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>2. Authentication Token Security & Encryption Standards</span>
        </h5>
        <p className="text-xs text-slate-300 leading-relaxed">
          Both LinkedIn and GitHub integration credentials (OAuth Refresh and Access Tokens) are encrypted in transit and at rest using enterprise-grade keys before being safely saved inside our secure isolated Firestore environment. These credentials are used solely to proxy direct publication actions instructed by you.
        </p>
      </div>

      {/* Section 3: GDPR Compliance & Deletion */}
      <div className="space-y-3">
        <h5 className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>3. GDPR Rights (Right to Erasure) & EU Withdrawal Rights</span>
        </h5>
        <p className="text-xs text-slate-300 leading-relaxed">
          We strictly follow the European Union's General Data Protection Regulation (GDPR) standards, empowering you with the following rights:
        </p>
        <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
          <li><strong>Right to be Forgotten:</strong> You can permanently delete your user account, drafted articles, scheduled posts, and connected API access credentials via the "Danger Zone - Permanently Delete Account" trigger inside settings. This request instantly purges all trace database schemas.</li>
          <li><strong>EU Right of Withdrawal:</strong> EU citizens hold the fundamental right to revoke this service consent and terminate associated integrations at any point, with zero residual data retention.</li>
        </ul>
      </div>
    </div>
  );
};

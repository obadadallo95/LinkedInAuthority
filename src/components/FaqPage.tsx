import React from 'react';
import { HelpCircle, Shield, FileText, Send } from 'lucide-react';
import { motion } from 'motion/react';

interface FaqPageProps {
  lang: 'ar' | 'en' | 'de';
}

const faqs = {
  ar: [
    {
      category: "تحليل المستودعات",
      icon: FileText,
      questions: [
        { q: "كيف يعمل تحليل الأكواد؟", a: "يختار النظام ملفات وأدلة مهمة بميزانية محدودة لفهم هيكل المشروع؛ قد تُحفظ مقتطفات evidence في snapshot للتحليل المتكرر." },
        { q: "هل تقومون بتخزين الكود الخاص بي؟", a: "قد تُحفظ مقتطفات محدودة من الملفات المختارة ومراجع الأدلة داخل snapshot للتحليل؛ النسخة التجريبية لا تضمن احتفاظًا صفريًا." }
      ]
    },
    {
      category: "النشر على LinkedIn",
      icon: Send,
      questions: [
        { q: "كيف يتم النشر على حسابي؟", a: "النشر المباشر على LinkedIn غير مطبق في النسخة التجريبية الحالية. يتم حفظ المحتوى كمسودة للمراجعة والنسخ اليدوي." },
        { q: "هل يمكنني جدولة المنشورات؟", a: "الجدولة التلقائية على LinkedIn غير مطبقة في النسخة التجريبية الحالية." }
      ]
    },
    {
      category: "الخصوصية والأمان",
      icon: Shield,
      questions: [
        { q: "هل يمكنني حذف بياناتي؟", a: "يوفر الإصدار التجريبي مسار حذف موثقاً يحذف بيانات Firebase وحساب المصادقة بشكل تكراري. يلزم التحقق من المشروع المنشور ومراجعة الاحتفاظ قبل تقديم ادعاء تنظيمي بالمحو الكامل." },
        { q: "هل بياناتي مشفرة؟", a: "يوفر Firebase حماية النقل والتخزين على مستوى المنصة، كما تُخزن بيانات اعتماد GitHub الجديدة مشفرة في سجل خادمي خاص. لا تعتبر النسخة التجريبية ذلك ضماناً شاملاً لكل مسارات البيانات." }
      ]
    }
  ],
  en: [
    {
      category: "Repository Analysis",
      icon: FileText,
      questions: [
        { q: "How does code analysis work?", a: "The system selects bounded core files and configs to understand project structure; selected evidence snippets may be stored in repository snapshots." },
        { q: "Do you store my code?", a: "Bounded snippets from selected evidence files and their references may be stored in repository snapshots; this beta does not promise zero retention." }
      ]
    },
    {
      category: "LinkedIn Publishing (planned)",
      icon: Send,
      questions: [
        { q: "How does posting to my account work?", a: "LinkedIn publishing is not implemented in the current beta. Generated content is saved as a draft for manual review and copying." },
        { q: "Can I schedule posts?", a: "Automatic LinkedIn scheduling is not implemented in the current beta." }
      ]
    },
    {
      category: "Privacy & Security",
      icon: Shield,
      questions: [
        { q: "Can I delete my data?", a: "The beta provides an authenticated account-deletion flow that recursively removes the user's Firebase data and Auth account. Deployed-project verification and retention review are still required before making a regulatory erasure claim." },
        { q: "Is my data encrypted?", a: "Firebase provides transport and platform-level storage protections. New GitHub credentials are additionally encrypted server-side with AES-256-GCM in an Admin-only record; this beta does not promise zero retention for repository-derived context or drafts." }
      ]
    }
  ],
  de: [
    {
      category: "Repository Analyse",
      icon: FileText,
      questions: [
        { q: "Wie funktioniert die Code-Analyse?", a: "Das System wählt begrenzte Kerndateien wie README und Konfigurationen aus, um die Projektstruktur zu verstehen; ausgewählte Evidenz-Ausschnitte können in Repository-Snapshots gespeichert werden." },
        { q: "Speichern Sie meinen Code?", a: "Begrenzte Ausschnitte ausgewählter Evidenzdateien und abgeleiteter Kontext können in Repository-Snapshots gespeichert werden; diese Beta verspricht keine Null-Aufbewahrung." }
      ]
    },
    {
      category: "LinkedIn Veröffentlichung",
      icon: Send,
      questions: [
        { q: "Wie funktioniert das Posten auf meinem Konto?", a: "Direktes LinkedIn-Posting ist in der aktuellen Beta nicht implementiert. Inhalte werden zur manuellen Prüfung und zum Kopieren als Entwurf gespeichert." },
        { q: "Kann ich Beiträge planen?", a: "Automatische LinkedIn-Planung ist in der aktuellen Beta nicht implementiert." }
      ]
    },
    {
      category: "Datenschutz & Sicherheit",
      icon: Shield,
      questions: [
        { q: "Kann ich meine Daten löschen?", a: "Die Beta bietet einen authentifizierten Löschvorgang, der die Firebase-Daten des Benutzers und das Auth-Konto rekursiv entfernt. Eine Prüfung der bereitgestellten Umgebung und der Aufbewahrung ist vor regulatorischen Aussagen erforderlich." },
        { q: "Sind meine Daten verschlüsselt?", a: "Firebase bietet Schutz für Übertragung und Speicherung auf Plattformebene. Neue GitHub-Zugangsdaten werden zusätzlich serverseitig mit AES-256-GCM in einem Admin-only-Datensatz verschlüsselt; diese Beta verspricht keine Null-Aufbewahrung für abgeleiteten Kontext oder Entwürfe." }
      ]
    }
  ]
};

export const FaqPage: React.FC<FaqPageProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const content = faqs[lang] || faqs.en;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar h-full relative" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 relative z-10 space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
              <HelpCircle className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {isAr ? 'الأسئلة الشائعة' : lang === 'de' ? 'Häufig gestellte Fragen' : 'Frequently Asked Questions'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {isAr ? 'كل ما تحتاج معرفته عن كيفية عمل المنصة' : lang === 'de' ? 'Alles, was Sie wissen müssen, wie die Plattform funktioniert' : 'Everything you need to know about how the platform works'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {content.map((section, sectionIdx) => {
            const Icon = section.icon;
            return (
              <motion.div 
                key={sectionIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIdx * 0.1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-xl font-bold text-white">{section.category}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.questions.map((q, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl hover:border-indigo-500/30 transition-colors">
                      <h3 className="font-bold text-white mb-2">{q.q}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{q.a}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

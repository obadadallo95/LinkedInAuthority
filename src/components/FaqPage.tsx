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
        { q: "كيف يعمل تحليل الأكواد؟", a: "يقوم النظام بقراءة الملفات الأساسية في المستودع مثل README وملفات الإعدادات لفهم هيكل المشروع دون تخزين الشفرة المصدرية." },
        { q: "هل تقومون بتخزين الكود الخاص بي؟", a: "لا، نحن لا نقوم بتخزين أي شفرة مصدرية على خوادمنا. المعالجة تتم بشكل لحظي فقط." }
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
        { q: "هل يمكنني حذف بياناتي؟", a: "نعم، يمكنك مسح كافة بياناتك ومنشوراتك وارتباطات حسابك بشكل نهائي من خلال خيار 'حذف الحساب' في صفحة الإعدادات." },
        { q: "هل بياناتي مشفرة؟", a: "نعم، كافة بيانات الاتصال مع قاعدة البيانات مشفرة باستخدام معايير الصناعة." }
      ]
    }
  ],
  en: [
    {
      category: "Repository Analysis",
      icon: FileText,
      questions: [
        { q: "How does code analysis work?", a: "The system reads core files like README and configs to understand project structure without storing your source code." },
        { q: "Do you store my code?", a: "No, we do not store any source code on our servers. Processing is strictly real-time." }
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
        { q: "Can I delete my data?", a: "The current beta's delete action does not yet guarantee removal from every collection. Review the implementation before relying on it for complete erasure." },
        { q: "Is my data encrypted?", a: "Transport and platform-level storage protections are provided by Firebase, but this beta does not implement a dedicated application-level token vault." }
      ]
    }
  ],
  de: [
    {
      category: "Repository Analyse",
      icon: FileText,
      questions: [
        { q: "Wie funktioniert die Code-Analyse?", a: "Das System liest Kerndateien wie README und Konfigurationen, um die Projektstruktur zu verstehen, ohne Ihren Quellcode zu speichern." },
        { q: "Speichern Sie meinen Code?", a: "Nein, wir speichern keinen Quellcode auf unseren Servern. Die Verarbeitung erfolgt streng in Echtzeit." }
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
        { q: "Kann ich meine Daten löschen?", a: "Ja, Sie können alle Ihre Daten, Beiträge und Kontoverknüpfungen dauerhaft über die Option 'Konto löschen' in den Einstellungen löschen." },
        { q: "Sind meine Daten verschlüsselt?", a: "Firebase bietet Schutz für Übertragung und Speicherung auf Plattformebene; diese Beta enthält jedoch keine eigene Token-Vault für Anwendungsschlüssel." }
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

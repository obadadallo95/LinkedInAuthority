import { FileText, Send, Shield, Zap, Sparkles, UserCheck, Globe, Code2, Lock, TrendingUp } from 'lucide-react';

export const faqsData = {
  ar: [
    {
      category: "مقدمة عن المنصة",
      icon: Sparkles,
      questions: [
        { q: "ما هو LinkedIn Authority Engine؟", a: "هو مساحة عمل تعتمد على الذكاء الاصطناعي للمطورين والشركات التقنية. تحلل أدلة محدودة من مستودعات GitHub وتحوّل العمل الهندسي المهم إلى مسودات LinkedIn موثقة قابلة للمراجعة والتحرير والنسخ اليدوي." },
        { q: "كيف يختلف عن أدوات النشر التقليدية مثل Buffer أو Hootsuite؟", a: "الأدوات التقليدية تركز على جدولة المحتوى. أما منصتنا فتركز على فهم سياق المستودع واكتشاف قصة هندسية تستحق المشاركة، ثم بناء مسودة موثقة تراجعها وتنسخها بنفسك؛ لا يوجد نشر تلقائي." },
        { q: "من هو الجمهور المستهدف لهذه الأداة؟", a: "مهندسو البرمجيات، قادة الفرق التقنية (Tech Leads)، المؤسسون التقنيون، والمساهمون في المصادر المفتوحة الذين يرغبون في بناء علامة تجارية شخصية قوية (Personal Brand) دون إهدار ساعات في كتابة المحتوى." }
      ]
    },
    {
      category: "آلية العمل وتحليل الكود",
      icon: Code2,
      questions: [
        { q: "كيف يعمل تحليل الأكواد؟", a: "يختار النظام ملفات وأدلة مهمة بميزانية محدودة لفهم هيكل المشروع والتقنيات والغرض منه؛ قد تُحفظ مقتطفات evidence في snapshot للتحليل المتكرر." },
        { q: "هل الأداة تفهم اللغات المتعددة والأطر (Frameworks)؟", a: "تدعم المنصة عدداً كبيراً من لغات البرمجة والأطر الشائعة عبر أدلة محدودة من المستودع. تختلف التغطية ودقة التفسير حسب المشروع، لذلك يجب مراجعة الادعاءات مقابل الأدلة المشار إليها." },
        { q: "هل يمكنني اختيار النبرة (Tone) الخاصة بالمنشور؟", a: "بالتأكيد. يمكنك ضبط إعدادات المنصة لاختيار نبرة 'احترافية'، 'تقنية عميقة'، 'قصصية'، أو حتى نبرة 'تسويقية' لتناسب طبيعة شبكتك على LinkedIn." }
      ]
    },
    {
      category: "النشر والجدولة",
      icon: Send,
      questions: [
        { q: "كيف يتم النشر على حساب LinkedIn الخاص بي؟", a: "النشر المباشر على LinkedIn غير مطبق في النسخة التجريبية الحالية. يتم حفظ المحتوى كمسودة للمراجعة والنسخ اليدوي." },
        { q: "هل يمكنني جدولة المنشورات للأوقات المزدحمة؟", a: "الجدولة التلقائية على LinkedIn غير مطبقة في النسخة التجريبية الحالية." },
        { q: "هل تدعم الأداة النشر بملفات الميديا أو الصور؟", a: "النسخة الحالية تركز على مسودات نصية تقنية قابلة للمراجعة والنسخ اليدوي. لا نقدم حالياً نشرًا أو تحليلات رسمية من LinkedIn." },
        { q: "ماذا لو لم يعجبني المنشور المولد؟", a: "الأداة توفر لك ميزة 'المسودات'. يمكنك تعديل أي كلمة، مراجعة الأدلة، حفظ نسخ متعددة، أو إنشاء مسودة منفصلة قبل نسخ النص ومشاركته يدوياً إن رغبت." }
      ]
    },
    {
      category: "الخصوصية والأمان",
      icon: Lock,
      questions: [
        { q: "هل تقومون بتخزين الكود المصدري (Source Code) الخاص بي؟", a: "قد تُحفظ مقتطفات محدودة من الملفات المختارة ومراجع الأدلة داخل snapshot للتحليل. لا نعد باحتفاظ صفري في النسخة التجريبية الحالية." },
        { q: "هل بياناتي مشفرة؟", a: "يوفر Firebase حماية النقل والتخزين على مستوى المنصة. بيانات اعتماد GitHub الجديدة تُشفّر إضافياً على الخادم باستخدام AES-256-GCM في سجل خاص لا يقرأه العميل؛ وقد تبقى مسودات وسياقات مشتقة محفوظة ضمن النسخة التجريبية." },
        { q: "كيف تحمون حساب LinkedIn الخاص بي من الحظر؟", a: "النشر المباشر على LinkedIn غير مطبق في النسخة التجريبية الحالية، لذلك لا توجد أتمتة نشر أو حدود API ندّعي إدارتها." },
        { q: "هل يمكنني حذف بياناتي وارتباطاتي نهائياً؟", a: "توفر النسخة التجريبية مسار حذف موثقاً يزيل شجرة بيانات Firebase وحساب المصادقة بشكل تكراري، مع بقاء التحقق من المشروع المنشور ومراجعة الاحتفاظ مطلوبة قبل تقديم ادعاء تنظيمي بالمحو الكامل." }
      ]
    },
    {
      category: "الميزات المتقدمة وتخصيص القوالب",
      icon: Zap,
      questions: [
        { q: "هل توفر الأداة قوالب (Templates) جاهزة؟", a: "نعم، المنصة تحتوي على مكتبة قوالب متقدمة يمكنك من خلالها حفظ أسلوب معين للنشر (مثل 'إطلاق ميزة جديدة' أو 'مشاركة تحديث تقني') وإعادة استخدامه بنقرة واحدة لاحقاً." },
        { q: "هل تدعم الأداة اللغات المتعددة للمنشورات؟", a: "نعم! يمكنك من خلال الإعدادات طلب توليد المنشور باللغة العربية، الإنجليزية، أو الألمانية، بغض النظر عن لغة الكود المصدري أو ملف الـ README." },
        { q: "كيف تفيد الأداة في تحسين محركات البحث الشخصية (SEO) الخاصة بي؟", a: "تساعدك المسودات التقنية الغنية بالكلمات المفتاحية على إعداد محتوى يمكنك مراجعته ونشره يدوياً على LinkedIn؛ لا نقدم تحليلات رسمية من LinkedIn." }
      ]
    },
    {
      category: "الدعم والتواصل والمطورين",
      icon: Globe,
      questions: [
        { q: "من يقف خلف تطوير هذه الأداة؟", a: "تم تطوير وتصميم هذه المنصة بواسطة المهندس Obada Dallo لمساعدة المطورين على تحويل أدلة العمل الهندسي إلى مسودات محتوى احترافية قابلة للمراجعة." },
        { q: "كيف يمكنني التواصل مع فريق التطوير في حال واجهت مشكلة؟", a: "يمكنك استخدام زر 'تواصل مع المطور' الموجود أسفل القائمة أو زيارة صفحة الاتصال الخاصة بالمهندس Obada Dallo (https://obadadallo.web.app/contact/)." },
        { q: "هل يمكن لشركتي الحصول على نسخة مخصصة (Enterprise)؟", a: "النسخة الحالية تجريبية وموجهة للاستخدام الفردي المحدود. يمكن التواصل معنا لمناقشة احتياجات الفرق، دون افتراض توفر نشر أو أتمتة LinkedIn." }
      ]
    }
  ],
  en: [
    {
      category: "Platform Introduction",
      icon: Sparkles,
      questions: [
        { q: "What is LinkedIn Authority Engine?", a: "It is an AI-powered drafting workspace for developers and tech companies. It analyzes bounded GitHub evidence and turns meaningful engineering work into reviewable, editable LinkedIn drafts for manual copying." },
        { q: "How is it different from Buffer or Hootsuite?", a: "This workspace focuses on bounded GitHub evidence and reviewable technical drafts. It is not a scheduler or a LinkedIn publishing tool." },
        { q: "Who is the target audience?", a: "Software Engineers, Tech Leads, Founders, and Open Source contributors who want to build a strong Personal Brand without wasting hours writing content." }
      ]
    },
    {
      category: "Code Analysis & How It Works",
      icon: Code2,
      questions: [
        { q: "How does the code analysis work?", a: "The system selects bounded core files and configurations to understand project structure and technologies; selected evidence snippets may be stored in repository snapshots." },
        { q: "Does the tool understand multiple frameworks?", a: "It supports many common programming languages and frameworks through bounded repository evidence. Coverage and interpretation vary by project, so generated claims should be checked against the cited evidence." },
        { q: "Can I choose the tone of the post?", a: "Absolutely. You can configure the engine to use a 'Professional', 'Deep Tech', 'Storytelling', or 'Marketing' tone based on your LinkedIn network." }
      ]
    },
    {
      category: "Publishing & Scheduling (planned)",
      icon: Send,
      questions: [
        { q: "How is content published to my LinkedIn?", a: "LinkedIn publishing is not implemented in the current beta. Generated content is saved as a draft for manual review and copying." },
        { q: "Can I schedule posts for busy times?", a: "Automatic LinkedIn scheduling is not implemented in the current beta." },
        { q: "Does the tool support media or images?", a: "The current beta focuses on reviewable text drafts. It does not publish to LinkedIn or provide official LinkedIn performance analytics." },
        { q: "What if I don't like the generated post?", a: "You have a full Drafts manager. Review the evidence, edit any word, save versions, or create a separate draft before copying and sharing manually if you choose." }
      ]
    },
    {
      category: "Privacy & Security",
      icon: Lock,
      questions: [
        { q: "Do you store my source code?", a: "The system selects bounded evidence files rather than sending the whole repository blindly. Selected snippets may be stored in snapshots; this beta does not promise zero retention." },
        { q: "Is my data encrypted?", a: "Firebase provides transport and platform-level storage protections. New GitHub credentials are additionally encrypted server-side with AES-256-GCM in an Admin-only record; this beta does not promise zero retention for repository-derived context or drafts." },
        { q: "How do you protect my LinkedIn account?", a: "Direct LinkedIn publishing is not implemented in the current beta, so the app does not claim to manage LinkedIn API limits or publishing safety." },
        { q: "Can I permanently delete my data?", a: "The beta provides an authenticated account-deletion flow that recursively removes the user's Firebase data and Auth account. Deployed-project verification and retention review are still required before making a regulatory erasure claim." }
      ]
    },
    {
      category: "Advanced Features",
      icon: Zap,
      questions: [
        { q: "Does the tool provide templates?", a: "Yes, we feature an advanced templates library. You can save a specific posting style (e.g., 'New Feature Launch') and reuse it with one click." },
        { q: "Are multi-language posts supported?", a: "Yes! Regardless of your source code language, you can command the engine to write the post in English, Arabic, or German." },
        { q: "How does this improve my personal SEO?", a: "Keyword-rich technical drafts can help you prepare content to review and publish manually on LinkedIn; the app does not provide official LinkedIn analytics." }
      ]
    },
    {
      category: "Support & Development",
      icon: Globe,
      questions: [
        { q: "Who is behind this tool?", a: "This platform was architected and developed by Obada Dallo to bridge the gap between coding and professional content creation." },
        { q: "How can I get support?", a: "Use the 'Contact Developer' button or visit Obada Dallo's official contact page (https://obadadallo.web.app/contact/)." },
        { q: "Can my company get an Enterprise version?", a: "The current beta is designed for limited individual use. Contact us to discuss team needs without assuming LinkedIn publishing or automation is available." }
      ]
    }
  ],
  de: [
    {
      category: "Einführung in die Plattform",
      icon: Sparkles,
      questions: [
        { q: "Was ist die LinkedIn Authority Engine?", a: "Es handelt sich um einen KI-gestützten Arbeitsbereich für Entwickler und Tech-Unternehmen. Begrenzte GitHub-Evidenz und wichtige technische Arbeit werden in prüfbare, bearbeitbare LinkedIn-Entwürfe zur manuellen Nutzung verwandelt." },
        { q: "Wie unterscheidet es sich von Buffer oder Hootsuite?", a: "Dieser Arbeitsbereich nutzt begrenzte GitHub-Evidenz für prüfbare technische Entwürfe. Er ist kein Planer und veröffentlicht nicht automatisch auf LinkedIn." },
        { q: "Wer ist die Zielgruppe?", a: "Softwareentwickler, Tech Leads, Gründer und Open-Source-Mitwirkende, die eine starke persönliche Marke aufbauen möchten, ohne Stunden mit dem Schreiben von Inhalten zu verschwenden." }
      ]
    },
    {
      category: "Code-Analyse & Funktionsweise",
      icon: Code2,
      questions: [
        { q: "Wie funktioniert die Code-Analyse?", a: "Das System liest Kerndateien wie README, package.json und Konfigurationen, um die Struktur und Technologien des Projekts zu erfassen, ohne Ihren Quellcode zu speichern." },
        { q: "Versteht das Tool mehrere Frameworks?", a: "Ja! Dank Large Language Models (LLMs) versteht unsere Plattform jede Programmiersprache und extrahiert den Kernwert, um Inhalte zu formulieren, die von Führungskräften und Entwicklern gleichermaßen verstanden werden." },
        { q: "Kann ich den Ton des Beitrags wählen?", a: "Absolut. Sie können die Engine so konfigurieren, dass sie basierend auf Ihrem LinkedIn-Netzwerk einen 'professionellen', 'tiefgreifenden', 'erzählerischen' oder 'Marketing'-Ton verwendet." }
      ]
    },
    {
      category: "Veröffentlichung & Planung",
      icon: Send,
      questions: [
        { q: "Wie werden Inhalte auf meinem LinkedIn veröffentlicht?", a: "Direktes LinkedIn-Posting ist in der aktuellen Beta nicht implementiert. Inhalte werden zur manuellen Prüfung und zum Kopieren als Entwurf gespeichert." },
        { q: "Kann ich Beiträge planen?", a: "Automatische LinkedIn-Planung ist in der aktuellen Beta nicht implementiert." },
        { q: "Unterstützt das Tool Medien oder Bilder?", a: "Die aktuelle Beta konzentriert sich auf prüfbare Textentwürfe. Sie veröffentlicht nicht auf LinkedIn und bietet keine offiziellen LinkedIn-Leistungsanalysen." },
        { q: "Was ist, wenn mir der generierte Beitrag nicht gefällt?", a: "Sie haben einen vollständigen Entwurfsmanager. Prüfen Sie die Evidenz, bearbeiten Sie jedes Wort, speichern Sie Versionen oder generieren Sie neu, bevor Sie den Entwurf manuell kopieren." }
      ]
    },
    {
      category: "Datenschutz & Sicherheit",
      icon: Lock,
      questions: [
        { q: "Speichern Sie meinen Quellcode?", a: "Begrenzte Ausschnitte ausgewählter Evidenzdateien und abgeleiteter Kontext können in Repository-Snapshots gespeichert werden; diese Beta verspricht keine Null-Aufbewahrung." },
        { q: "Sind meine Daten verschlüsselt?", a: "Firebase bietet Schutz für Übertragung und Speicherung auf Plattformebene. Neue GitHub-Zugangsdaten werden zusätzlich serverseitig mit AES-256-GCM in einem Admin-only-Datensatz verschlüsselt; diese Beta verspricht keine Null-Aufbewahrung für abgeleiteten Kontext oder Entwürfe." },
        { q: "Wie schützen Sie mein LinkedIn-Konto?", a: "Direktes Veröffentlichen auf LinkedIn ist in der aktuellen Beta nicht implementiert; die App beansprucht daher keine Verwaltung von LinkedIn-API-Limits oder Veröffentlichungssicherheit." },
        { q: "Kann ich meine Daten dauerhaft löschen?", a: "Die Beta bietet einen authentifizierten Löschvorgang, der die Firebase-Daten des Benutzers und das Auth-Konto rekursiv entfernt. Eine Prüfung der bereitgestellten Umgebung und der Aufbewahrung ist vor regulatorischen Aussagen erforderlich." }
      ]
    },
    {
      category: "Erweiterte Funktionen",
      icon: Zap,
      questions: [
        { q: "Bietet das Tool Vorlagen?", a: "Ja, wir verfügen über eine erweiterte Vorlagenbibliothek. Sie können einen bestimmten Veröffentlichungsstil speichern und mit einem Klick wiederverwenden." },
        { q: "Werden mehrsprachige Beiträge unterstützt?", a: "Ja! Unabhängig von Ihrer Quellcode-Sprache können Sie den Beitrag auf Englisch, Arabisch oder Deutsch verfassen lassen." },
        { q: "Wie verbessert dies meine persönliche SEO?", a: "Technische Entwürfe mit klaren Begriffen können Ihnen helfen, Inhalte für eine manuelle Veröffentlichung vorzubereiten; die App bietet keine offiziellen LinkedIn- oder Recruiter-Analysen." }
      ]
    },
    {
      category: "Support & Entwicklung",
      icon: Globe,
      questions: [
        { q: "Wer steckt hinter diesem Tool?", a: "Diese Plattform wurde von Obada Dallo entwickelt, um die Lücke zwischen Programmierung und professioneller Inhaltserstellung zu schließen." },
        { q: "Wie erhalte ich Support?", a: "Nutzen Sie die Schaltfläche 'Entwickler kontaktieren' oder besuchen Sie die offizielle Kontaktseite von Obada Dallo (https://obadadallo.web.app/contact/)." },
        { q: "Kann mein Unternehmen eine Enterprise-Version erhalten?", a: "Die aktuelle Beta ist für eine begrenzte individuelle Nutzung ausgelegt. Kontaktieren Sie uns, um Team-Anforderungen zu besprechen, ohne LinkedIn-Veröffentlichung oder Automatisierung vorauszusetzen." }
      ]
    }
  ]
};

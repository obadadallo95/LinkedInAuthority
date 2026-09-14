import { FileText, Send, Shield, Zap, Sparkles, UserCheck, Globe, Code2, Lock, TrendingUp } from 'lucide-react';

export const faqsData = {
  ar: [
    {
      category: "مقدمة عن المنصة",
      icon: Sparkles,
      questions: [
        { q: "ما هو LinkedIn Authority Engine؟", a: "هو محرك متطور يعتمد على الذكاء الاصطناعي، صُمم خصيصاً للمطورين والشركات التقنية. يقوم بربط مستودعات GitHub الخاصة بك وتحليل الكود تلقائياً لتحويله إلى منشورات ومقالات احترافية جاهزة للنشر على LinkedIn." },
        { q: "كيف يختلف عن أدوات النشر التقليدية مثل Buffer أو Hootsuite؟", a: "الأدوات التقليدية هي مجرد 'مجدول' (Scheduler) للمحتوى الذي تكتبه أنت. أما منصتنا فهي 'صانع محتوى' (Content Creator). نحن نفهم الكود الخاص بك، بنية مشروعك، والتقنيات المستخدمة، ونبني قصة احترافية حولها بالنيابة عنك، ثم نتيح لك جدولتها أو نشرها فوراً." },
        { q: "من هو الجمهور المستهدف لهذه الأداة؟", a: "مهندسو البرمجيات، قادة الفرق التقنية (Tech Leads)، المؤسسون التقنيون، والمساهمون في المصادر المفتوحة الذين يرغبون في بناء علامة تجارية شخصية قوية (Personal Brand) دون إهدار ساعات في كتابة المحتوى." }
      ]
    },
    {
      category: "آلية العمل وتحليل الكود",
      icon: Code2,
      questions: [
        { q: "كيف يعمل تحليل الأكواد؟", a: "يقوم النظام بقراءة الملفات الأساسية في المستودع مثل README، package.json، وملفات الإعدادات لفهم هيكل المشروع، التقنيات المستخدمة، والغرض من المشروع بشكل ذكي، دون تخزين الشفرة المصدرية." },
        { q: "هل الأداة تفهم اللغات المتعددة والأطر (Frameworks)؟", a: "نعم! بفضل دمج النماذج اللغوية الكبيرة (LLMs)، يمكن للمنصة فهم أي لغة برمجة (Python, JS, Rust, Go وغيرها) واستخراج القيمة الجوهرية من الكود لصياغة محتوى يفهمه المدراء التنفيذيون والمبرمجون على حد سواء." },
        { q: "هل يمكنني اختيار النبرة (Tone) الخاصة بالمنشور؟", a: "بالتأكيد. يمكنك ضبط إعدادات المنصة لاختيار نبرة 'احترافية'، 'تقنية عميقة'، 'قصصية'، أو حتى نبرة 'تسويقية' لتناسب طبيعة شبكتك على LinkedIn." }
      ]
    },
    {
      category: "النشر والجدولة",
      icon: Send,
      questions: [
        { q: "كيف يتم النشر على حساب LinkedIn الخاص بي؟", a: "النشر المباشر على LinkedIn غير مطبق في النسخة التجريبية الحالية. يتم حفظ المحتوى كمسودة للمراجعة والنسخ اليدوي." },
        { q: "هل يمكنني جدولة المنشورات للأوقات المزدحمة؟", a: "الجدولة التلقائية على LinkedIn غير مطبقة في النسخة التجريبية الحالية." },
        { q: "هل تدعم الأداة النشر بملفات الميديا أو الصور؟", a: "النسخة الحالية تركز على صناعة النصوص التقنية العميقة التي تتفوق في خوارزميات LinkedIn. النشر المتعدد الوسائط قيد التطوير وسيصدر قريباً." },
        { q: "ماذا لو لم يعجبني المنشور المولد؟", a: "الأداة توفر لك ميزة 'المسودات'. يمكنك تعديل أي كلمة، إعادة التوليد، أو إضافة لمساتك الخاصة قبل الضغط على زر النشر النهائي." }
      ]
    },
    {
      category: "الخصوصية والأمان",
      icon: Lock,
      questions: [
        { q: "هل تقومون بتخزين الكود المصدري (Source Code) الخاص بي؟", a: "قطعاً لا. نحن لا نقوم بتخزين أي شفرة مصدرية على خوادمنا. المعالجة تتم بشكل لحظي فقط لاستخراج البيانات الوصفية وبناء المحتوى، ثم يتم التخلص منها." },
        { q: "هل بياناتي مشفرة؟", a: "يوفر Firebase حماية النقل والتخزين على مستوى المنصة، لكن النسخة التجريبية لا تطبق خزنة رموز مخصصة على مستوى التطبيق." },
        { q: "كيف تحمون حساب LinkedIn الخاص بي من الحظر؟", a: "النشر المباشر على LinkedIn غير مطبق في النسخة التجريبية الحالية، لذلك لا توجد أتمتة نشر أو حدود API ندّعي إدارتها." },
        { q: "هل يمكنني حذف بياناتي وارتباطاتي نهائياً؟", a: "ميزة الحذف الحالية في النسخة التجريبية لا تضمن بعد إزالة البيانات من كل المجموعات. راجع التنفيذ قبل الاعتماد عليها كمحو كامل." }
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
        { q: "من يقف خلف تطوير هذه الأداة؟", a: "تم تطوير وتصميم هذه المنصة بواسطة المهندس Obada Dallo، لتكون الأداة الأولى من نوعها التي تسد الفجوة بين الكود البرمجي وصناعة المحتوى الاحترافي." },
        { q: "كيف يمكنني التواصل مع فريق التطوير في حال واجهت مشكلة؟", a: "يمكنك استخدام زر 'تواصل مع المطور' الموجود أسفل القائمة أو زيارة صفحة الاتصال الخاصة بالمهندس Obada Dallo (https://obadadallo.web.app/contact/)." },
        { q: "هل يمكن لشركتي الحصول على نسخة مخصصة (Enterprise)؟", a: "نعم، نحن نقدم حلولاً مخصصة للشركات التقنية التي ترغب في أتمتة نشر إنجازات فرقها البرمجية (Engineering Blogs). يرجى التواصل معنا للحصول على التفاصيل." }
      ]
    }
  ],
  en: [
    {
      category: "Platform Introduction",
      icon: Sparkles,
      questions: [
        { q: "What is LinkedIn Authority Engine?", a: "It is an advanced AI-powered engine designed specifically for developers and tech companies. It connects to your GitHub repositories, analyzes your code intelligently, and transforms it into highly professional, ready-to-publish LinkedIn posts." },
        { q: "How is it different from Buffer or Hootsuite?", a: "Traditional tools are mere 'schedulers'. We are a 'Content Creator'. We understand your codebase, tech stack, and project structure, and build a compelling professional narrative around it on your behalf." },
        { q: "Who is the target audience?", a: "Software Engineers, Tech Leads, Founders, and Open Source contributors who want to build a strong Personal Brand without wasting hours writing content." }
      ]
    },
    {
      category: "Code Analysis & How It Works",
      icon: Code2,
      questions: [
        { q: "How does the code analysis work?", a: "The system reads core files like README, package.json, and configurations to grasp the project's structure and technologies without storing your source code." },
        { q: "Does the tool understand multiple frameworks?", a: "Yes! Powered by Large Language Models (LLMs), our platform understands any programming language and extracts the core value to formulate content understood by executives and developers alike." },
        { q: "Can I choose the tone of the post?", a: "Absolutely. You can configure the engine to use a 'Professional', 'Deep Tech', 'Storytelling', or 'Marketing' tone based on your LinkedIn network." }
      ]
    },
    {
      category: "Publishing & Scheduling (planned)",
      icon: Send,
      questions: [
        { q: "How is content published to my LinkedIn?", a: "LinkedIn publishing is not implemented in the current beta. Generated content is saved as a draft for manual review and copying." },
        { q: "Can I schedule posts for busy times?", a: "Automatic LinkedIn scheduling is not implemented in the current beta." },
        { q: "Does the tool support media or images?", a: "The current version excels at creating deep, text-based technical narratives which perform incredibly well in LinkedIn's algorithm. Media support is coming soon." },
        { q: "What if I don't like the generated post?", a: "You have a full 'Drafts' manager. You can edit any word, regenerate completely, or add personal touches before hitting publish." }
      ]
    },
    {
      category: "Privacy & Security",
      icon: Lock,
      questions: [
        { q: "Do you store my source code?", a: "Absolutely not. Code is processed in real-time strictly to extract metadata and generate the narrative, then it is immediately discarded." },
        { q: "Is my data encrypted?", a: "Transport and platform-level storage protections are provided by Firebase, but this beta does not implement a dedicated application-level token vault." },
        { q: "How do you protect my LinkedIn account?", a: "Direct LinkedIn publishing is not implemented in the current beta, so the app does not claim to manage LinkedIn API limits or publishing safety." },
        { q: "Can I permanently delete my data?", a: "The current beta's delete action does not yet guarantee removal from every collection. Review the implementation before relying on it for complete erasure." }
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
        { q: "Can my company get an Enterprise version?", a: "Yes, we provide custom solutions for tech companies aiming to automate their Engineering Blogs and team achievements. Contact us for details." }
      ]
    }
  ],
  de: [
    {
      category: "Einführung in die Plattform",
      icon: Sparkles,
      questions: [
        { q: "Was ist die LinkedIn Authority Engine?", a: "Es handelt sich um eine fortschrittliche, KI-gesteuerte Engine, die speziell für Entwickler und Tech-Unternehmen entwickelt wurde. Sie verbindet Ihre GitHub-Repositories, analysiert Ihren Code intelligent und verwandelt ihn in hochprofessionelle, veröffentlichungsbereite LinkedIn-Beiträge." },
        { q: "Wie unterscheidet es sich von Buffer oder Hootsuite?", a: "Herkömmliche Tools sind reine 'Planer'. Wir sind ein 'Content Creator'. Wir verstehen Ihre Codebasis, Ihren Tech-Stack und Ihre Projektstruktur und bauen in Ihrem Namen eine überzeugende professionelle Erzählung darum auf." },
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
        { q: "Unterstützt das Tool Medien oder Bilder?", a: "Die aktuelle Version zeichnet sich durch die Erstellung tiefer, textbasierter technischer Erzählungen aus, die im LinkedIn-Algorithmus hervorragend abschneiden. Medienunterstützung kommt bald." },
        { q: "Was ist, wenn mir der generierte Beitrag nicht gefällt?", a: "Sie haben einen vollständigen Entwurfsmanager. Sie können jedes Wort bearbeiten, vollständig neu generieren oder persönliche Note hinzufügen, bevor Sie auf Veröffentlichen klicken." }
      ]
    },
    {
      category: "Datenschutz & Sicherheit",
      icon: Lock,
      questions: [
        { q: "Speichern Sie meinen Quellcode?", a: "Absolut nicht. Der Code wird streng in Echtzeit verarbeitet, nur um Metadaten zu extrahieren, und dann sofort verworfen." },
        { q: "Sind meine Daten verschlüsselt?", a: "Firebase bietet Schutz für Übertragung und Speicherung auf Plattformebene; diese Beta enthält jedoch keine eigene Token-Vault für Anwendungsschlüssel." },
        { q: "Wie schützen Sie mein LinkedIn-Konto?", a: "Direktes Veröffentlichen auf LinkedIn ist in der aktuellen Beta nicht implementiert; die App beansprucht daher keine Verwaltung von LinkedIn-API-Limits oder Veröffentlichungssicherheit." },
        { q: "Kann ich meine Daten dauerhaft löschen?", a: "Die Löschfunktion der aktuellen Beta garantiert noch nicht die Entfernung aus jeder Sammlung. Prüfen Sie die Implementierung vor einer vollständigen Löschung." }
      ]
    },
    {
      category: "Erweiterte Funktionen",
      icon: Zap,
      questions: [
        { q: "Bietet das Tool Vorlagen?", a: "Ja, wir verfügen über eine erweiterte Vorlagenbibliothek. Sie können einen bestimmten Veröffentlichungsstil speichern und mit einem Klick wiederverwenden." },
        { q: "Werden mehrsprachige Beiträge unterstützt?", a: "Ja! Unabhängig von Ihrer Quellcode-Sprache können Sie den Beitrag auf Englisch, Arabisch oder Deutsch verfassen lassen." },
        { q: "Wie verbessert dies meine persönliche SEO?", a: "Die konsequente Veröffentlichung von schlüsselwortreichem technischem Inhalt führt dazu, dass Ihr Profil in den Suchergebnissen von Recruitern deutlich höher rankt." }
      ]
    },
    {
      category: "Support & Entwicklung",
      icon: Globe,
      questions: [
        { q: "Wer steckt hinter diesem Tool?", a: "Diese Plattform wurde von Obada Dallo entwickelt, um die Lücke zwischen Programmierung und professioneller Inhaltserstellung zu schließen." },
        { q: "Wie erhalte ich Support?", a: "Nutzen Sie die Schaltfläche 'Entwickler kontaktieren' oder besuchen Sie die offizielle Kontaktseite von Obada Dallo (https://obadadallo.web.app/contact/)." },
        { q: "Kann mein Unternehmen eine Enterprise-Version erhalten?", a: "Ja, wir bieten maßgeschneiderte Lösungen für Tech-Unternehmen an, die ihre Engineering-Blogs automatisieren möchten. Kontaktieren Sie uns für Details." }
      ]
    }
  ]
};

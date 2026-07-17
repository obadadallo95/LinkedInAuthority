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
        { q: "كيف يتم النشر على حساب LinkedIn الخاص بي؟", a: "نستخدم منصة LinkedIn API الرسمية. بمجرد ربط حسابك، نرسل المحتوى مباشرة إلى ملفك الشخصي كمنشور نصي، ولا نحتفظ ببيانات تسجيل الدخول الخاصة بك بل نستخدم رموز وصول آمنة (OAuth)." },
        { q: "هل يمكنني جدولة المنشورات للأوقات المزدحمة؟", a: "نعم، النظام يوفر ميزة الجدولة الذكية. يمكنك اختيار وقت محدد في المستقبل، وسيقوم المحرك بالنشر تلقائياً بالنيابة عنك دون تدخل منك." },
        { q: "هل تدعم الأداة النشر بملفات الميديا أو الصور؟", a: "النسخة الحالية تركز على صناعة النصوص التقنية العميقة التي تتفوق في خوارزميات LinkedIn. النشر المتعدد الوسائط قيد التطوير وسيصدر قريباً." },
        { q: "ماذا لو لم يعجبني المنشور المولد؟", a: "الأداة توفر لك ميزة 'المسودات'. يمكنك تعديل أي كلمة، إعادة التوليد، أو إضافة لمساتك الخاصة قبل الضغط على زر النشر النهائي." }
      ]
    },
    {
      category: "الخصوصية والأمان",
      icon: Lock,
      questions: [
        { q: "هل تقومون بتخزين الكود المصدري (Source Code) الخاص بي؟", a: "قطعاً لا. نحن لا نقوم بتخزين أي شفرة مصدرية على خوادمنا. المعالجة تتم بشكل لحظي فقط لاستخراج البيانات الوصفية وبناء المحتوى، ثم يتم التخلص منها." },
        { q: "هل بياناتي مشفرة؟", a: "نعم، كافة بيانات الاتصال والتخزين في قاعدة البيانات مشفرة بالكامل باستخدام معايير التشفير العسكرية (AES-256) المتوافقة مع معايير الصناعة." },
        { q: "كيف تحمون حساب LinkedIn الخاص بي من الحظر؟", a: "نحن نستخدم الـ API الرسمي والموثق من LinkedIn، ونلتزم بحدود النشر (Rate limits) لضمان أن حسابك آمن 100% ولا يتعرض لأي عقوبات." },
        { q: "هل يمكنني حذف بياناتي وارتباطاتي نهائياً؟", a: "نعم، وفقاً لمعايير اللائحة العامة لحماية البيانات (GDPR)، توفر لك المنصة زراً واحداً لـ 'حذف الحساب' يمسح جميع منشوراتك، ارتباطاتك بـ GitHub و LinkedIn، وكل ما يتعلق بك من خوادمنا بشكل نهائي ولا رجعة فيه." }
      ]
    },
    {
      category: "الميزات المتقدمة وتخصيص القوالب",
      icon: Zap,
      questions: [
        { q: "هل توفر الأداة قوالب (Templates) جاهزة؟", a: "نعم، المنصة تحتوي على مكتبة قوالب متقدمة يمكنك من خلالها حفظ أسلوب معين للنشر (مثل 'إطلاق ميزة جديدة' أو 'مشاركة تحديث تقني') وإعادة استخدامه بنقرة واحدة لاحقاً." },
        { q: "هل تدعم الأداة اللغات المتعددة للمنشورات؟", a: "نعم! يمكنك من خلال الإعدادات طلب توليد المنشور باللغة العربية، الإنجليزية، أو الألمانية، بغض النظر عن لغة الكود المصدري أو ملف الـ README." },
        { q: "كيف تفيد الأداة في تحسين محركات البحث الشخصية (SEO) الخاصة بي؟", a: "النشر المستمر لمحتوى تقني غني بالكلمات المفتاحية الصحيحة (والذي نولده لك) يجعل حسابك على LinkedIn يظهر في نتائج البحث الأولى للشركات والمستقطبين (Recruiters) الذين يبحثون عن خبراتك." }
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
      category: "Publishing & Scheduling",
      icon: Send,
      questions: [
        { q: "How is content published to my LinkedIn?", a: "We utilize the official LinkedIn API. Once connected, we send the content securely to your profile. We do not store passwords; we use secure OAuth tokens." },
        { q: "Can I schedule posts for busy times?", a: "Yes, the system offers smart scheduling. You can pick a specific future date and time, and the engine will publish it for you automatically." },
        { q: "Does the tool support media or images?", a: "The current version excels at creating deep, text-based technical narratives which perform incredibly well in LinkedIn's algorithm. Media support is coming soon." },
        { q: "What if I don't like the generated post?", a: "You have a full 'Drafts' manager. You can edit any word, regenerate completely, or add personal touches before hitting publish." }
      ]
    },
    {
      category: "Privacy & Security",
      icon: Lock,
      questions: [
        { q: "Do you store my source code?", a: "Absolutely not. Code is processed in real-time strictly to extract metadata and generate the narrative, then it is immediately discarded." },
        { q: "Is my data encrypted?", a: "Yes, all data in transit and at rest is encrypted using industry-standard military-grade (AES-256) encryption." },
        { q: "How do you protect my LinkedIn account?", a: "We strictly adhere to LinkedIn's official API guidelines and rate limits, ensuring your account remains 100% safe and compliant." },
        { q: "Can I permanently delete my data?", a: "Yes, in full GDPR compliance, we provide a 1-click 'Delete Account' button that irrevocably wipes your posts, GitHub/LinkedIn connections, and all associated data from our servers." }
      ]
    },
    {
      category: "Advanced Features",
      icon: Zap,
      questions: [
        { q: "Does the tool provide templates?", a: "Yes, we feature an advanced templates library. You can save a specific posting style (e.g., 'New Feature Launch') and reuse it with one click." },
        { q: "Are multi-language posts supported?", a: "Yes! Regardless of your source code language, you can command the engine to write the post in English, Arabic, or German." },
        { q: "How does this improve my personal SEO?", a: "Consistently publishing keyword-rich technical content (which we automate for you) makes your profile rank significantly higher when recruiters and companies search for your specific skills." }
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
        { q: "Wie werden Inhalte auf meinem LinkedIn veröffentlicht?", a: "Wir nutzen die offizielle LinkedIn-API. Wir speichern keine Passwörter, sondern verwenden sichere OAuth-Token." },
        { q: "Kann ich Beiträge planen?", a: "Ja, das System bietet intelligente Planung. Sie können ein bestimmtes Datum und eine Uhrzeit auswählen, und die Engine veröffentlicht es automatisch für Sie." },
        { q: "Unterstützt das Tool Medien oder Bilder?", a: "Die aktuelle Version zeichnet sich durch die Erstellung tiefer, textbasierter technischer Erzählungen aus, die im LinkedIn-Algorithmus hervorragend abschneiden. Medienunterstützung kommt bald." },
        { q: "Was ist, wenn mir der generierte Beitrag nicht gefällt?", a: "Sie haben einen vollständigen Entwurfsmanager. Sie können jedes Wort bearbeiten, vollständig neu generieren oder persönliche Note hinzufügen, bevor Sie auf Veröffentlichen klicken." }
      ]
    },
    {
      category: "Datenschutz & Sicherheit",
      icon: Lock,
      questions: [
        { q: "Speichern Sie meinen Quellcode?", a: "Absolut nicht. Der Code wird streng in Echtzeit verarbeitet, nur um Metadaten zu extrahieren, und dann sofort verworfen." },
        { q: "Sind meine Daten verschlüsselt?", a: "Ja, alle Daten werden während der Übertragung und im Ruhezustand mit branchenüblicher AES-256-Verschlüsselung nach Militärstandard verschlüsselt." },
        { q: "Wie schützen Sie mein LinkedIn-Konto?", a: "Wir halten uns strikt an die offiziellen API-Richtlinien und Ratenbegrenzungen von LinkedIn, um sicherzustellen, dass Ihr Konto zu 100% sicher und konform bleibt." },
        { q: "Kann ich meine Daten dauerhaft löschen?", a: "Ja, in voller Übereinstimmung mit der DSGVO bieten wir eine 1-Klick-Schaltfläche zum Löschen des Kontos, mit der alle Ihre Beiträge und verknüpften Daten dauerhaft von unseren Servern gelöscht werden." }
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

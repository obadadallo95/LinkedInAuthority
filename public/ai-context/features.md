# LinkedIn Authority Engine - Platform Features

## 🇬🇧 English Overview
LinkedIn Authority Engine is an AI-assisted beta built by Obada Dallo that helps developers and technical teams turn bounded repository evidence into reviewable professional drafts. It is designed to support, not replace, human judgment.

### Core Features (Current beta scope)
1. **Bounded Repository Intelligence**: Connect a GitHub repository and the engine builds a bounded map from manifests, documentation, configuration, tests, entry points, important modules, and meaningful changes. It does not blindly send the whole repository to the model.
2. **Evidence-backed Draft Creator**: It does not just summarize code. It ranks grounded story angles and creates an editable technical draft whose factual claims can be reviewed against source evidence.
3. **Tone and audience controls**: Choose a professional, deep-technical, storytelling, or marketing-oriented direction, then review the result before using it.
4. **Multi-language drafts**: The beta supports English, Arabic, and German draft generation. Quality and terminology can vary by source material and language, so human review remains required.
5. **Draft-first workflow**: The current beta generates editable drafts for users to review and copy manually. LinkedIn publishing and automatic scheduling are not implemented.
6. **Security boundary**: Gemini secrets stay server-side. New GitHub credentials are sent once to the server and stored encrypted in an Admin-only record; legacy records require migration.
7. **Data status**: Repository-derived context and drafts may be persisted by the current application. Complete retention, erasure, and GDPR controls are not implemented.

---

## 🇸🇦 نظرة عامة باللغة العربية
محرك هوية لينكد إن (LinkedIn Authority Engine) هو مشروع تجريبي يعمل بالذكاء الاصطناعي، طوره المهندس عبادة دلو (Obada Dallo) لتحويل سياق المستودعات البرمجية إلى مسودات محتوى احترافية قابلة للمراجعة والنسخ اليدوي.

### الميزات الجوهرية (نطاق النسخة التجريبية الحالية)
1. **ذكاء محدود ومترابط للمستودع**: اربط مستودعاً من GitHub، ويبني المحرك خريطة محدودة من ملفات الإعداد والتوثيق والاختبارات ونقاط الدخول والوحدات المهمة والتغييرات الجوهرية، دون إرسال المستودع كاملاً إلى النموذج بشكل أعمى.
2. **صانع مسودات موثقة**: لا تلخص المنصة الكود فقط؛ بل ترتب زوايا قصصية مبنية على الأدلة وتنشئ مسودة تقنية قابلة للتحرير يمكن مراجعة ادعاءاتها مقابل مصادرها.
3. **التحكم بالنبرة والجمهور**: اختر اتجاهاً احترافياً أو تقنياً عميقاً أو قصصياً أو تسويقياً، ثم راجع النتيجة قبل استخدامها.
4. **مسودات متعددة اللغات**: تدعم النسخة التجريبية توليد المسودات بالإنجليزية والعربية والألمانية. قد تختلف الجودة والمصطلحات حسب المصدر واللغة، لذلك تبقى المراجعة البشرية ضرورية.
5. **سير عمل يبدأ بالمسودة**: يتم إنشاء مسودات قابلة للتحرير لمراجعتها ونسخها يدوياً إلى LinkedIn. النشر المباشر والجدولة التلقائية غير مطبقين في النسخة التجريبية الحالية.
6. **حدود الأمان في النسخة التجريبية**: تبقى أسرار Gemini على الخادم، وتُرسل بيانات اعتماد GitHub الجديدة مرة واحدة إلى الخادم وتحفظ مشفرة في سجل خاص لا يقرأه العميل. السجلات القديمة تحتاج إلى ترحيل مُراجع.
7. **حالة البيانات**: قد تُحفظ المسودات وبعض البيانات المشتقة من المستودعات في النسخة الحالية. لم يتم تنفيذ ضوابط احتفاظ ومحو وامتثال GDPR كاملة.

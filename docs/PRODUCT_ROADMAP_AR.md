# خارطة الطريق الشاملة لمنتج LinkedIn Authority

> وثيقة المنتج والتطوير المرجعية — Product & Technical Roadmap

**اسم المنتج الحالي:** LinkedIn Authority  
**نوع المنتج:** SaaS لصناعة وإدارة محتوى LinkedIn للمطورين والمؤسسين وأصحاب الخبرات التقنية  
**حالة الوثيقة:** مرجع حيّ قابل للتحديث  
**تاريخ الإنشاء:** 17 يوليو/تموز 2026  
**لغة المرجع الأساسية:** العربية  
**مالك المنتج والمؤسس:** Obada Dallo  

---

## 1. هدف الوثيقة

هذه الوثيقة هي المرجع الرئيسي لكل ما يتعلق بتطوير LinkedIn Authority. تجمع في مكان واحد:

- أصل الفكرة والمشكلة التي يحلها المنتج.
- هوية المنتج وتموضعه في السوق.
- تقييم النسخة الحالية كما هي منفذة فعلياً.
- القرارات التي تم الاتفاق عليها أثناء مراجعة المنتج.
- ما يجب الاحتفاظ به، تحسينه، إكماله، تأجيله أو حذفه.
- خارطة طريق المنتج والتطوير والأمن والتشغيل.
- معايير قبول واضحة لكل مرحلة.
- المخاطر والاعتماديات والتكاليف.
- خطة إطلاق واختبار وتسعير واقعية.
- سجل قرارات يساعد على منع التذبذب وتكرار النقاشات مستقبلاً.

هذه الوثيقة لا تفترض أننا نبني شركة ضخمة من اليوم الأول، ولا تختزل المنتج إلى مولّد منشورات بسيط. الهدف هو الوصول إلى SaaS احترافي، متماسك، آمن، صادق وقابل للبيع، اعتماداً على المنتج الموجود حالياً.

---

## 2. ملخص تنفيذي

LinkedIn Authority ليس فكرة أولية ولا واجهة تجريبية صغيرة. المشروع يحتوي بالفعل على معظم مكونات SaaS حديث:

- Landing Page.
- تسجيل دخول وOnboarding.
- تكامل GitHub.
- تكامل LinkedIn أولي.
- تحليل مستودعات.
- توليد محتوى باستخدام Gemini.
- محرر منشورات.
- مسودات وقوالب.
- بطاقات بصرية.
- تخطيط وجدولة واجهية.
- تحليلات.
- إعدادات وخصوصية ووثائق قانونية.
- دعم العربية والإنجليزية والألمانية.

لكن اكتمال الواجهة لا يساوي الجاهزية للبيع. المشروع متقدم بصرياً وهيكلياً، بينما لا تزال طبقة التشغيل والأمن والفوترة وترابط الرحلة بحاجة إلى عمل مركز.

### التقدير الحالي

| البعد | التقدير التقريبي |
|---|---:|
| اكتمال الواجهة والهيكل | 75–80% |
| وضوح تجربة المنتج | 60% |
| جودة محرك المحتوى | 55% |
| الاستقرار والاختبارات | 45–50% |
| الأمان وحماية التكلفة | 30% |
| الجاهزية لاستقبال Beta مغلقة | 60% بعد إصلاحات حرجة |
| الجاهزية للبيع العام | 45–55% |

الفجوة الأساسية ليست في نقص الصفحات، بل في:

1. حماية الخادم والأسرار والتكلفة.
2. إصلاح وظائف تظهر كمكتملة وهي جزئية أو غير مترابطة.
3. توحيد رحلة المستخدم.
4. تقوية محرك المحتوى بالحقائق والزوايا والأدلة.
5. إضافة نظام استخدام وخطط وفوترة قبل البيع العام.

---

## 3. أصل المشكلة وسبب وجود المنتج

بُني المنتج لحل مشكلة عاشها المؤسس بنفسه:

> لدي مشاريع كثيرة أعمل عليها على GitHub، لكنني لا أعرف كيف أكون نشطاً اجتماعياً على LinkedIn أو كيف أحوّل عملي التقني إلى محتوى يعرّف الناس بقدراتي ويجلب لي فرص عمل أو عملاء.

هذه نقطة قوة أساسية لأنها تحقق Founder–User Fit:

- المؤسس هو أول مستخدم للمنتج.
- المشكلة ليست افتراضية أو مصطنعة.
- الاستخدام الحقيقي قابل للقياس أسبوعياً.
- يمكن تطوير المنتج من خلال تجربة المؤسس قبل الحاجة إلى آلاف المستخدمين.

### الفرضية الأساسية

هناك عدد كبير من الأشخاص الذين:

- يبنون مشاريع حقيقية لكن لا يتحدثون عنها.
- يمتلكون GitHub قوياً وLinkedIn ضعيفاً.
- لا يعرفون كيف يحولون القرارات التقنية إلى قصص مهنية.
- لا يحبون الاستعراض أو الكتابة الاجتماعية.
- يريدون وظائف أو عملاء أو جمهوراً تقنياً.
- لا يملكون الوقت لصناعة محتوى مستمر.

### المهمة الأساسية للمنتج

> تحويل العمل والخبرة والأفكار الحقيقية إلى محتوى LinkedIn مهني وأصيل، ثم مساعدة المستخدم على تحسينه وتنظيمه ونشره ومتابعته.

### الوعد الأبسط

> أنت تبني. LinkedIn Authority يساعدك أن تحكي باحتراف عما بنيته.

---

## 4. هوية المنتج وحدوده

### 4.1 ما هو المنتج؟

LinkedIn Authority هو مساحة عمل لصناعة وإدارة محتوى LinkedIn، موجهة خصوصاً للمطورين والمؤسسين والخبراء التقنيين، مع محرك متخصص يحوّل المشاريع والنشاط التقني إلى محتوى مهني.

### 4.2 ما ليس المنتج؟

المنتج ليس:

- مولد منشور واحد ثم زر نسخ فقط.
- أداة GitHub لإدارة المستودعات.
- أداة Social Media عامة لكل المنصات.
- نسخة مطابقة عن Taplio.
- منصة Enterprise للفرق والوكالات في نسختها الأولى.
- نظام نشر ذاتي بالكامل دون مراجعة المستخدم.
- بديلاً عن LinkedIn نفسه.

### 4.3 مكان GitHub في المنتج

GitHub هو أقوى مصدر محتوى داخل المنتج وأهم عنصر تميز، لكنه ليس تعريف المنتج بالكامل.

يظهر GitHub في:

- مصدر داخل Create Flow.
- GitHub Studio متخصص.
- فرص وأفكار محتوى داخل Home.
- أدلة ومراجع داخل المنشور.
- محتوى Releases وCommits وPull Requests والملفات.

ويجب أن يتمكن المستخدم مستقبلاً من الاستفادة من أغلب المنتج دون ربط GitHub، من خلال فكرة أو ملاحظات أو إنجاز مهني أو نص.

### 4.4 الجمهور الأساسي

#### الجمهور الأول

- المطورون الباحثون عن عمل.
- المستقلون التقنيون الباحثون عن عملاء.
- Indie Hackers.
- المؤسسون التقنيون.
- أصحاب المشاريع المفتوحة المصدر.

#### الجمهور الثاني لاحقاً

- Engineering Leaders.
- Developer Advocates وDevRel.
- Security Researchers.
- Technical Consultants.
- Ghostwriters المتخصصون بالمحتوى التقني.

#### الجمهور غير المستهدف حالياً

- الوكالات الكبيرة متعددة الحسابات.
- فرق التسويق العامة غير التقنية.
- المستخدم الذي يريد أتمتة التعليقات والرسائل الجماعية.
- المستخدم الذي يريد النشر على عشر منصات من مكان واحد.

---

## 5. أهداف المنتج

### 5.1 الهدف الأساسي

تمكين المستخدم من الوصول من مشروع أو فكرة حقيقية إلى منشور LinkedIn ممتاز خلال دقائق، مع أقل قدر ممكن من التوتر والكتابة اليدوية.

### 5.2 أهداف التجربة

- إعطاء المستخدم أول نتيجة مفيدة بسرعة.
- جعل النص يبدو كخبرة حقيقية لا كإجابة AI عامة.
- إبقاء المستخدم صاحب القرار النهائي قبل النشر.
- تنظيم رحلة المحتوى من المصدر إلى النشر.
- تقليل تكرار الأفكار والمنشورات.
- توفير سبب واضح للعودة أسبوعياً.

### 5.3 أهداف العمل التجاري

- إطلاق Beta مغلقة قليلة التكلفة.
- إثبات أن المستخدم يعود لإنشاء منشور ثانٍ وثالث.
- حماية تكلفة Gemini من إساءة الاستخدام.
- الوصول إلى أول مستخدمين يدفعون بسبب قيمة متكررة.
- تطوير المنتج بالاعتماد على الاستخدام الفعلي لا على كثرة الميزات.

### 5.4 أهداف غير معتمدة حالياً

- الوصول إلى آلاف المستخدمين فوراً.
- بناء حلول فرق ووكالات.
- دعم كل أنواع منشورات LinkedIn من أول إصدار.
- بناء نظام تحليلات تسويقي متكامل قبل توفر البيانات.
- أتمتة حضور المستخدم بالكامل.

---

## 6. مبادئ اتخاذ قرارات المنتج

كل ميزة جديدة أو موجودة يجب أن تمر عبر الأسئلة التالية:

1. هل تحل مشكلة حقيقية للمؤسس أو المستخدم المستهدف؟
2. هل تسرّع الوصول إلى منشور جيد؟
3. هل ترفع جودة المنشور أو صدقه أو تنظيمه؟
4. هل التنفيذ الحالي يعمل ويمكن الاعتماد عليه؟
5. هل تعطي انطباع SaaS احترافي دون ادعاء مضلل؟
6. هل تستحق تكلفة التطوير والصيانة والتعقيد؟
7. هل نملك البيانات والصلاحيات اللازمة لتنفيذها؟
8. هل يمكن قياس فائدتها؟

### القرارات الممكنة لأي ميزة

- **KEEP:** تبقى كما هي.
- **IMPROVE:** تبقى مع تحسين.
- **COMPLETE:** واجهتها موجودة لكن يلزم إكمال التنفيذ.
- **MERGE:** تندمج مع رحلة أو صفحة أخرى.
- **RELABEL:** تبقى لكن باسم ووعد أدق.
- **DEFER:** تؤجل إلى مرحلة لاحقة.
- **REMOVE:** تحذف لأنها مضللة أو مكررة أو غير مفيدة.

### قاعدة الصدق الوظيفي

أي زر أو وصف ظاهر للمستخدم يجب أن يحقق واحداً من الآتي:

- يعمل فعلياً.
- يظهر بوضوح كـBeta.
- يظهر كميزة قادمة ولا يسمح باستخدامها.
- يتحول إلى نسخة أخف لكنها صادقة.

---

## 7. رحلة المستخدم المستهدفة

### 7.1 الرحلة الأساسية

1. يزور المستخدم Landing Page ويفهم المشكلة والحل.
2. ينشئ حساباً عبر Google أو GitHub.
3. يحدد هدفه والجمهور الذي يريد الوصول إليه.
4. يختار مصدر المحتوى.
5. إذا اختار GitHub، يربط الحساب ويحدد المشروع أو الحدث.
6. يستخرج النظام حقائق وفرص محتوى.
7. يعرض النظام ثلاث زوايا مختلفة.
8. يختار المستخدم زاوية.
9. يولّد النظام منشوراً وبطاقة اختيارية.
10. يعدّل المستخدم النص في المحرر.
11. يراجع الادعاءات والمصدر والمعاينة.
12. يحفظه أو يخطط له أو ينسخه أو ينشره.
13. يسجّل النظام النتيجة ويمنع التكرار مستقبلاً.

### 7.2 مصادر المحتوى

- مشروع GitHub.
- Release.
- Commit أو مجموعة Commits.
- Pull Request.
- فكرة حرة.
- نص أو ملاحظات.
- إنجاز مهني.
- تجربة أو درس تعلمه المستخدم.
- قالب أو Content Framework.
- منشور سابق يريد إعادة استخدامه.

### 7.3 أهداف المستخدم

- الحصول على وظيفة.
- جذب عملاء.
- بناء حضور مهني.
- الترويج لمشروع أو منتج.
- مشاركة المعرفة.
- بناء جمهور تقني.
- إظهار القيادة والخبرة.

### 7.4 الجمهور المستهدف للمنشور

- مطورون.
- Recruiters.
- مؤسسون.
- عملاء تقنيون.
- عملاء غير تقنيين.
- Managers وEngineering Leaders.
- جمهور مختلط.

---

## 8. خريطة المنتج المستهدفة

### التنقل الرئيسي المقترح

1. **Home**
2. **Create**
3. **Content**
4. **Calendar**
5. **Insights**
6. **Settings**

### أقسام ثانوية

- GitHub Studio داخل Create أو Home.
- Templates/Frameworks داخل Create وContent.
- Help داخل قائمة المستخدم.
- Legal Center في Footer والإعدادات.
- Diagnostics داخل Settings > Advanced.

---

## 9. مراجعة الصفحات والقرارات

## 9.1 Landing Page

**القرار:** IMPROVE  
**الأولوية:** عالية

### ما يبقى

- الهوية البصرية التقنية.
- عرض GitHub → LinkedIn.
- دعم اللغات.
- CTA واضح.
- FAQ مختصر.
- البطاقات والمعاينة كجزء من العرض.

### ما يتغير

- تحويل الرسالة من Enterprise AI Automation إلى حل المشكلة الحقيقية.
- عرض قصة Founder–User Fit.
- إضافة Before/After واقعي.
- توضيح الجمهور المستهدف.
- إظهار مصادر المحتوى الأخرى دون إضعاف GitHub.
- إضافة قسم يوضح الفرق عن ChatGPT والأدوات العامة.
- جعل الادعاءات مطابقة لما يعمل فعلياً.

### الرسالة المقترحة

**العنوان:**

> حوّل مشاريعك وخبرتك التقنية إلى حضور مهني على LinkedIn.

**الوصف:**

> LinkedIn Authority يساعدك على اكتشاف القصص الموجودة داخل عملك الحقيقي، ثم يحولها إلى منشورات احترافية تستطيع تعديلها وتخطيطها ونشرها بثقة.

### ما يحذف أو يعدّل

- Enterprise-grade إن لم توجد متطلبات Enterprise فعلية.
- Predictive Reach غير المبني على بيانات حقيقية.
- 100% safe أو 100% compliant.
- Auto Publish قبل اكتمال العامل الخلفي.
- أي ادعاء أن البيانات لا ترسل إلى طرف ثالث.
- أسماء نماذج Gemini كقيمة تسويقية رئيسية.

### معايير القبول

- يستطيع زائر جديد شرح المنتج بجملة واحدة بعد قراءة Hero.
- يرى مثالاً حقيقياً كاملاً قبل التسجيل.
- كل ادعاء تسويقي مرتبط بوظيفة عاملة.
- لا توجد وعود تناقض سياسة الخصوصية أو التنفيذ.

---

## 9.2 Login

**القرار:** IMPROVE  
**الأولوية:** متوسطة

### ما يبقى

- Google Login.
- GitHub Login.
- التصميم البسيط.
- روابط Privacy وTerms.

### التعديلات

- جعل LinkedIn Integration منفصلة عن Login الأساسي حالياً.
- توضيح أن GitHub يستخدم لجلب المشاريع بإذن المستخدم.
- إضافة نتيجة متوقعة: الوصول لأول فكرة/منشور خلال دقائق.
- عدم عرض وعود أمنية غير منفذة.

### معايير القبول

- يعمل Google وGitHub Login بلا أخطاء.
- يعالج ربط Provider مستخدماً مسبقاً برسالة مفهومة.
- لا يتم تسريب Access Token في الواجهة أو Logs.

---

## 9.3 Onboarding

**القرار:** RESTRUCTURE  
**الأولوية:** عالية

### المسار المستهدف

1. الهدف.
2. الجمهور.
3. اللغة والنبرة.
4. مصدر البداية.
5. ربط GitHub إذا اختاره.
6. اختيار مشروع.
7. إنشاء أول نتيجة.
8. ربط LinkedIn عند طلب النشر.

### قرارات مهمة

- لا يجب أن يكون LinkedIn شرطاً لإكمال Onboarding.
- لا ينتهي Onboarding برسالة احتفال فقط؛ ينتهي بمنشور أو زوايا محتوى.
- يجب توفير Skip منطقي مع إمكانية الإكمال لاحقاً.

### معايير القبول

- يمكن إكمال Onboarding دون LinkedIn.
- يتم حفظ الهدف والجمهور والتفضيلات.
- يصل المستخدم لأول قيمة داخل الجلسة الأولى.
- يمكن استئناف Onboarding بعد إغلاق الصفحة.

---

## 9.4 Home Dashboard

**القرار:** BUILD USING EXISTING COMPONENTS  
**الأولوية:** عالية

### محتوى الصفحة

- زر Create رئيسي.
- Continue Editing.
- آخر المسودات.
- المنشورات المخطط لها.
- المشاريع الأخيرة.
- فرصة محتوى واحدة أو أكثر من GitHub.
- ملخص استخدام الخطة.
- Empty State مفيد للمستخدم الجديد.

### ما لا يجب أن تكونه Home

- قائمة مستودعات فقط.
- لوحة KPI كبيرة بلا إجراءات.
- صفحة أخبار أو إحصائيات تجميلية.

### معايير القبول

- يعرف المستخدم خلال ثوانٍ ما الخطوة التالية.
- يستطيع متابعة آخر مسودة بنقرة.
- يستطيع بدء Create Flow بنقرة واحدة.

---

## 9.5 Create Flow / Generator

**القرار:** MERGE & EXPAND  
**الأولوية:** عالية جداً

### المشكلة الحالية

Generator Modal يعتمد على GitHub ويكرر جزءاً من Repositories Dashboard.

### التدفق الجديد

#### الخطوة 1: المصدر

- GitHub.
- فكرة.
- ملاحظات أو نص.
- إنجاز مهني.
- قالب.

#### الخطوة 2: السياق

- الهدف.
- الجمهور.
- اللغة.
- العمق التقني.
- النبرة.

#### الخطوة 3: الزوايا

إظهار ثلاث زوايا مثل:

- قصة البناء.
- شرح القرار التقني.
- الأثر المهني أو التجاري.

#### الخطوة 4: التوليد

- توليد النسخة المختارة.
- إمكانية توليد نسخة بديلة.
- إنشاء بطاقة بصرية اختيارية.

### معايير القبول

- توجد نقطة إنشاء واحدة منطقياً في النظام.
- كل أزرار Create تفتح الرحلة نفسها مع اختلاف المصدر المسبق.
- لا يُحفظ Post فارغ أو مكرر عند فشل Gemini.
- يحتفظ المنشور بالمصدر والهدف والجمهور والزاوية.

---

## 9.6 GitHub Studio / Repositories

**القرار:** KEEP & STRENGTHEN  
**الأولوية:** عالية

### الوظائف الحالية التي تبقى

- عرض المستودعات.
- البحث والفلاتر.
- Organizations.
- Branch selection.
- README preview.
- اختيار ملفات.
- Private repositories عند توفر الصلاحية.
- Multi-repository كخيار متقدم.

### التطويرات القريبة

- آخر وقت تحليل.
- ما الجديد منذ آخر تحليل.
- Releases.
- Commits المهمة.
- Pull Requests المدمجة.
- اكتشاف التقنيات.
- استبعاد ملفات حساسة.
- Content history لكل مستودع.
- زر تجاهل حدث أو فرصة.
- إظهار سبب اقتراح الفرصة.

### ضوابط الخصوصية

- عدم إرسال `.env` أو الأسرار أو مفاتيح الوصول.
- قائمة أنماط ملفات مستبعدة افتراضياً.
- عرض واضح لما سيرسل إلى Gemini.
- موافقة المستخدم على تحليل Private Repository.
- حد أقصى لحجم المحتوى.

### معايير القبول

- لا يحتاج المستخدم لإدخال PAT يدوياً في المسار الطبيعي.
- لا يصل GitHub Token إلى JavaScript بعد نقله للخادم.
- تظهر أخطاء GitHub بصياغة مفهومة.
- يتم احترام Rate Limit.

---

## 9.7 Posts Hub / Content

**القرار:** KEEP AS CORE  
**الأولوية:** عالية جداً

### الحالات المستهدفة

- Idea.
- Generated.
- Editing.
- Ready.
- Planned.
- Scheduled for Auto Publish.
- Published.
- Failed.
- Archived.
- Template/Framework منفصل عن المنشورات العادية.

### الوظائف الأساسية

- قائمة المحتوى.
- بحث وفلاتر.
- Autosave.
- Duplicate.
- Archive.
- Delete مع تأكيد.
- مصدر المنشور.
- Version history.
- Copy.
- Preview.
- Planner.
- Publish عند توفر التكامل.

### معايير القبول

- لا يحدث تعارض بين `template` و`templates`.
- يمكن استعادة نسخة سابقة.
- تظهر حالة الحفظ بوضوح.
- لا يتم فقدان تعديلات المستخدم عند فشل AI.
- كل منشور يملك timestamps موحدة.

---

## 9.8 Post Editor

**القرار:** ORGANIZE, NOT REMOVE  
**الأولوية:** عالية

### مجموعات الأدوات

#### Rewrite

- More personal.
- More concise.
- More technical.
- Simpler.
- More confident.

#### Improve

- Stronger hook.
- Better structure.
- Improve clarity.
- Add CTA.
- Remove AI-sounding language.

#### Evidence

- Verify claims.
- Show supporting source.
- Flag unsupported metrics.
- Add technical specificity.

#### Repurpose — لاحقاً أو داخل Advanced

- X Thread.
- Article.
- Newsletter.
- Dev.to.

### ميزات المحرر الضرورية

- Undo/Redo.
- Autosave موثوق.
- Version history بسيط.
- Character count.
- See more fold preview.
- Hashtags بسيطة وغير مزعجة.
- مقارنة Before/After قبل استبدال النص.

### ما يخرج من الواجهة الأساسية

- Cynical persona.
- Tech Quiz.
- ASCII Architecture.
- SEO Booster بصيغته التسويقية الحالية.
- عشرات الشخصيات غير الواضحة.

لا يلزم حذف الكود فوراً؛ يمكن نقله إلى Advanced أو إخفاؤه حتى يثبت الاستخدام.

### معايير القبول

- كل عملية AI توضح هل ستستبدل النص أم تقترح نسخة.
- يمكن رفض التعديل والعودة للنص السابق.
- لا يسمح للذكاء الاصطناعي بتغيير الحقائق دون تنبيه.

---

## 9.9 Visual Cards

**القرار:** KEEP  
**الأولوية:** متوسطة

### الرؤية

بطاقات بصرية تقنية جميلة ترفع جودة المنشور دون تحويل المنتج إلى Canva.

### القوالب المقترحة

- Release Card.
- Code Insight.
- Architecture.
- Before/After.
- Quote/Lesson.
- Verified Metric.

### الضوابط

- لا توجد أرقام مولدة من الخيال.
- Metric تظهر فقط إذا كانت موثقة أو أدخلها المستخدم.
- البطاقة اختيارية.
- العنوان والوصف قابلان للتعديل.
- Export PNG يعمل بجودة ثابتة.

---

## 9.10 Templates / Content Frameworks

**القرار:** KEEP & INTEGRATE  
**الأولوية:** متوسطة

### الاسم المقترح

- Content Frameworks.
- أو Playbooks.

### القوالب الأساسية

- Problem → Decision → Result.
- What I Built.
- Launch Story.
- Technical Deep Dive.
- Lessons Learned.
- Career Proof.
- Open-source Contribution.
- Weekly Build Update.

### المطلوب

- تمرير القالب فعلياً لمحرك التوليد.
- تعريف الجمهور والهدف المناسب لكل قالب.
- مثال حقيقي.
- تحديد البيانات المطلوبة.
- عدم بناء مكتبة ضخمة في البداية.

---

## 9.11 Calendar

**القرار:** KEEP WITH HONEST STATES  
**الأولوية:** متوسطة

### المرحلة الأولى

- Content Planner.
- تحديد تاريخ ووقت مخطط.
- عرض أسبوعي/شهري.
- Reminder داخل التطبيق.
- Copy + Open LinkedIn.

### المرحلة الثانية

- Auto Publishing worker.
- Queue.
- Retry.
- Failed state.
- Idempotency.
- Token-expiry handling.

### قاعدة التسمية

- `Planned` عندما يُحفظ الموعد فقط.
- `Scheduled` عندما توجد مهمة خلفية فعلية.
- `Published` بعد استلام نجاح موثق ومعرّف المنشور.

---

## 9.12 Analytics / Insights

**القرار:** KEEP IN TWO LAYERS  
**الأولوية:** متوسطة

### الطبقة الأولى: بيانات داخلية

- عدد المنشورات المولدة.
- عدد المسودات.
- عدد المنشورات الجاهزة.
- عدد مرات النسخ.
- عدد المنشورات المخططة.
- انتظام الاستخدام.
- مصادر المحتوى المستخدمة.
- أكثر Framework استخداماً.
- معدل Idea → Ready.

### الطبقة الثانية: بيانات LinkedIn

- Reactions.
- Comments.
- Reposts.
- Impressions إذا سمحت الصلاحيات.
- Engagement rate إذا توفرت المقامات اللازمة.
- Top posts.

### Insights لاحقاً

- أي زاوية تحقق نتيجة أفضل؟
- أي موضوع يجذب تعليقات تقنية؟
- ما طول المنشور الأفضل للمستخدم؟
- هل المحتوى الشخصي أفضل من التقني العميق؟

### ضوابط

- لا تعرض أرقام Demo كأنها حقيقية.
- لا تعرض صفر على أنه أداء حقيقي عند فشل API.
- ميّز بين `No data` و`0` و`Permission unavailable`.

---

## 9.13 Settings

**القرار:** REORGANIZE  
**الأولوية:** عالية

### الأقسام

#### Profile

- الاسم.
- اللغة.
- المنطقة الزمنية.
- الدور.
- الهدف.
- الجمهور.

#### Content Preferences

- اللغة الافتراضية.
- النبرة.
- الطول.
- العمق التقني.
- Emoji preference.
- Hashtag preference.
- CTA style.
- كلمات ممنوعة.
- عينات أسلوب.

#### Integrations

- GitHub.
- LinkedIn.
- حالة الاتصال.
- الصلاحيات.
- انتهاء التوكن.
- Disconnect.

#### Privacy & Data

- البيانات المخزنة.
- Retention.
- Export.
- Delete account.
- حذف Cache.
- مستودعات وملفات مستبعدة.

#### Usage & Billing

- الخطة.
- الاستخدام.
- الحدود.
- تاريخ التجديد.
- الفواتير.

#### Advanced Diagnostics

- Connection logs.
- API tests.
- Token diagnostics دون عرض التوكن.
- معلومات الإصدار.

---

## 9.14 Help and Legal

**القرار:** CONSOLIDATE  
**الأولوية:** عالية قبل البيع

### الهيكل

- Help Center واحد.
- Legal Center واحد.
- زر Help صغير.
- Empty States تعليمية داخل الصفحات.

### صفحات Legal المطلوبة

- Privacy Policy.
- Terms of Service.
- Cookie notice إذا لزم.
- AI processing disclosure.
- Subprocessors list.
- Data deletion instructions.

### شروط أساسية

- النص القانوني يصف التنفيذ الحالي لا الرؤية المستقبلية.
- توضيح أن محتوى المشروع قد يرسل إلى Google Gemini.
- توضيح استخدام Firebase وGitHub وLinkedIn.
- تحديد مدة الاحتفاظ.
- توضيح مسؤولية المستخدم عن مراجعة المنشور.

---

## 10. محرك الذكاء الاصطناعي المستهدف

## 10.1 المشكلة الحالية

التدفق الحالي يجمع وصف المستودع وREADME و`package.json`، ثم يطلب منشوراً واحداً. هذا مفيد لكنه لا يطابق عمق الواجهة والوعد التسويقي.

## 10.2 التدفق المستهدف

```text
Source ingestion
→ Sanitization and secret filtering
→ Fact extraction
→ Opportunity detection
→ Angle generation
→ User selects angle
→ Post generation
→ Claim inspection
→ Optional visual generation
→ Save with sources
```

## 10.3 Fact Extraction

النظام يستخرج JSON منظماً:

- اسم المشروع.
- المشكلة التي يحلها.
- الجمهور.
- التقنيات.
- الميزات.
- القرارات المعمارية.
- Releases.
- تغييرات مهمة.
- Metrics موثقة.
- قيود وعدم يقين.
- مصادر كل حقيقة.

## 10.4 Opportunity Detection

الفرص الممكنة:

- إطلاق مشروع.
- Release جديد.
- Feature مهمة.
- Migration.
- تحسين أداء موثق.
- قرار معماري.
- مشكلة صعبة وحلها.
- درس تعلمه المستخدم.
- مساهمة Open Source.
- Milestone موثق.

## 10.5 Angle Generation

لكل فرصة، يقترح النظام ثلاث زوايا مختلفة على الأقل مع:

- عنوان الزاوية.
- الجمهور المناسب.
- سبب أهميتها.
- الحقائق التي ستستخدم.
- مستوى العمق.

## 10.6 Claim Inspector — نسخة أولى بسيطة

تصنيف الجمل المهمة إلى:

- `verified`: موجودة صراحة في المصدر.
- `user_provided`: أدخلها المستخدم.
- `inferred`: استنتاج منطقي يجب مراجعته.
- `unsupported`: لا يوجد دليل كافٍ.

لا يلزم بناء نظام بحث علمي متقدم. يكفي منع الأرقام والادعاءات الحساسة غير المدعومة.

## 10.7 حماية Prompt

- اعتبار محتوى المستودع بيانات غير موثوقة.
- منع تعليمات الملفات من تغيير System Prompt.
- تحديد طول كل مصدر.
- إزالة الأسرار قبل الإرسال.
- عدم تضمين التوكنات في Prompt أو Logs.
- التحقق من JSON Schema.
- معالجة فشل النموذج دون حفظ محتوى وهمي.

## 10.8 Cost Controls

- Model routing حسب المهمة.
- نموذج اقتصادي للاستخراج والهاشتاغ.
- نموذج أقوى فقط للتوليد النهائي عند الحاجة.
- Cache للحقائق والتحليلات.
- عدم إعادة تحليل المصدر نفسه دون تغييرات.
- حد لحجم السياق.
- عداد استخدام لكل عملية.

---

## 11. الأمن والخصوصية

## 11.1 المخاطر الحرجة الحالية

- API endpoints دون تحقق Firebase.
- لا يوجد Rate limiting أو Quotas.
- GitHub وLinkedIn tokens في Firestore والعميل.
- LinkedIn OAuth state ثابتة.
- Access token يرسل عبر `postMessage("*")`.
- اعتماد الواجهة على التوكنات مباشرة.
- سياسات قانونية قد لا تطابق التنفيذ.

## 11.2 المعمارية الأمنية المستهدفة

```text
Browser
  → Firebase ID Token
API Middleware
  → Verify identity
  → Validate input
  → Check entitlement/quota
  → Load encrypted integration token server-side
  → Call GitHub / LinkedIn / Gemini
  → Record usage and audit result
  → Return sanitized response
```

## 11.3 متطلبات المصادقة

- Firebase Admin SDK على الخادم.
- Middleware موحد لكل `/api/*` عدا health وOAuth callback الضروري.
- ربط كل طلب بـ`uid` موثق.
- عدم قبول `userId` من Body كمصدر ثقة.

## 11.4 إدارة الأسرار

- تخزين التوكنات على الخادم فقط.
- تشفير at rest باستخدام KMS/Secret Manager أو مفتاح تشفير مُدار بعناية.
- عدم إرجاع التوكن بعد الربط.
- Masked token hint فقط إن لزم.
- Rotation وRevoke.
- عدم تسجيل Authorization headers.

## 11.5 Rate Limiting and Quotas

أنواع الحدود:

- Requests per minute حسب IP.
- Requests per minute حسب UID.
- AI operations per day/month.
- Repository analyses per month.
- Maximum files and characters per analysis.
- Concurrency limit.

## 11.6 OAuth LinkedIn

- State عشوائية قصيرة العمر.
- تخزين state وربطها بالمستخدم والجلسة.
- Origin محدد في `postMessage`.
- عدم إرسال access token للنافذة الأم.
- callback يخزن التوكن ثم يرسل success فقط.
- معالجة رفض الصلاحيات وانتهاء التوكن.

## 11.7 Firestore

- فصل Profile/Preferences عن Secrets.
- Validation أكثر صرامة للحقول.
- منع حقول غير معروفة عند الحاجة.
- قواعد Usage وEntitlements لا تسمح للعميل بتعديلها.
- Server timestamps بدلاً من الثقة الكاملة بوقت العميل.

---

## 12. LinkedIn Integration

### الوظائف المستهدفة

- Sign in/Connect باستخدام OAuth الرسمي.
- نشر منشور نصي.
- حفظ Post URN/ID.
- إظهار Permalink.
- جلب Metrics المتاحة فعلياً.
- كشف انتهاء التوكن.
- Disconnect/Revoke.

### قرارات النسخة الأولى

- يبقى النشر المباشر ميزة مهمة لكن يمكن وسمها Beta حتى تثبت موثوقيتها.
- يبقى Copy + Open LinkedIn مساراً دائماً.
- لا تعتمد قيمة المنتج كلها على LinkedIn API.
- لا تعرض Analytics غير متاحة بسبب الصلاحيات كأنها أصفار.

### تحديثات تقنية مطلوبة

- الانتقال من UGC Posts API إلى Posts API المناسبة.
- إضافة headers الخاصة بالإصدار عند الحاجة.
- توحيد مسارات API بين العميل والخادم.
- حفظ `linkedinPostId` أو URN بعد النشر.
- معالجة الأخطاء حسب status code.
- اختبارات End-to-End بحساب فعلي قبل تفعيل الميزة للجميع.

---

## 13. الجدولة والتشغيل الخلفي

### Planner — النسخة القريبة

- يحفظ موعداً مخططاً.
- يعرض المنشور في Calendar.
- يرسل تذكيراً داخل التطبيق.
- يسمح بالنسخ وفتح LinkedIn.

### Auto Publishing — النسخة اللاحقة

يتطلب:

- Queue أو Cloud Tasks.
- Worker موثوق.
- Job document.
- Idempotency key.
- Retry محدود مع Backoff.
- حالات queued/running/succeeded/failed/cancelled.
- التحقق من التوكن قبل الموعد.
- سجل نشر.
- حماية من النشر المكرر.

### معيار اكتمال Auto Publish

لا تسمى الميزة Auto Scheduling إلا بعد نجاح اختبارات:

- النشر في الوقت المطلوب.
- إعادة المحاولة عند خطأ مؤقت.
- عدم التكرار.
- إلغاء المهمة.
- إظهار الفشل للمستخدم.

---

## 14. نموذج البيانات المستهدف

### User Profile

- `uid`
- `displayName`
- `email`
- `locale`
- `timezone`
- `role`
- `goal`
- `audience`
- `createdAt`
- `updatedAt`

### Content Preferences

- `defaultLanguage`
- `tone`
- `length`
- `technicalDepth`
- `emojiLevel`
- `hashtagLevel`
- `ctaStyle`
- `blockedPhrases`

### Integration Metadata — دون الأسرار

- `provider`
- `status`
- `accountId`
- `accountName`
- `scopes`
- `connectedAt`
- `expiresAt`
- `lastCheckedAt`
- `lastErrorCode`

### Post

- `id`
- `ownerId`
- `title`
- `text`
- `status`
- `sourceType`
- `sourceRefs`
- `goal`
- `audience`
- `angle`
- `frameworkId`
- `language`
- `cardConfig`
- `scheduledAt`
- `publishedAt`
- `linkedinPostId`
- `linkedinPermalink`
- `createdAt`
- `updatedAt`

### Post Version

- `postId`
- `versionNumber`
- `text`
- `changeType`
- `createdAt`
- `createdBy`

### Usage Record

- `uid`
- `operation`
- `model`
- `inputUnits`
- `outputUnits`
- `estimatedCost`
- `createdAt`
- `requestId`

### Entitlement

- `uid`
- `plan`
- `status`
- `periodStart`
- `periodEnd`
- `limits`
- `stripeCustomerId`
- `stripeSubscriptionId`

---

## 15. جودة الكود والمعمارية

## 15.1 مشكلات حالية

- أخطاء TypeScript تمنع `tsc --noEmit` من النجاح.
- اختبارات GitHub service قديمة أو غير متطابقة مع التنفيذ.
- `App.tsx` يحمل مسؤوليات كثيرة.
- اختلاف أنواع Tabs وStatuses.
- استخدام `any` في مناطق كثيرة.
- Imports ديناميكية وثابتة متضاربة لـFirebase.
- Bundle رئيسي كبير.
- اسم الحزمة `react-example` والإصدار `0.0.0`.
- وثائق تحتوي أوصافاً لا تطابق البنية أو التنفيذ.

## 15.2 المعمارية المستهدفة

### Frontend

- Feature-based structure.
- Router حقيقي للصفحات.
- API client موحد يضيف Firebase ID Token.
- Typed DTOs.
- Error boundary.
- Query/cache layer عند الحاجة.
- فصل View state عن Server state.

### Backend

- `middleware/auth.ts`
- `middleware/rateLimit.ts`
- `middleware/validate.ts`
- `services/ai/*`
- `services/github/*`
- `services/linkedin/*`
- `services/usage/*`
- `routes/*`
- `repositories/*` أو data access layer.

### تقسيم App.tsx

- App shell.
- Route definitions.
- Feature hooks.
- Create flow controller.
- Publishing service.
- Toast/error service.

## 15.3 Quality Gates

لا يسمح بالدمج أو النشر إذا فشل:

- TypeScript.
- Unit tests.
- Integration tests الحرجة.
- Production build.
- Lint/format.
- Secret scan.
- Dependency audit حسب سياسة severity.

---

## 16. استراتيجية الاختبارات

### Unit Tests

- تحليل واستبعاد الملفات.
- Fact extraction parsing.
- Status transitions.
- Usage limit calculations.
- Date/timezone helpers.
- Claim classifications.

### Frontend Component Tests

- Onboarding.
- Create Flow.
- Posts Hub.
- Post Editor.
- Planner.
- Integration states.
- Empty and error states.

### Backend Integration Tests

- Auth middleware.
- Quota enforcement.
- Analyze repository.
- AI schema failure.
- LinkedIn callback state.
- Publish success/failure.
- Analytics routing.

### End-to-End Tests

- Login → Onboarding → Generate → Edit → Copy.
- GitHub connect → Select repo → Generate.
- LinkedIn connect → Publish → Save post ID.
- Planner flow.
- Upgrade/checkout flow.

### Security Tests

- Unauthenticated API call rejected.
- User cannot access another user's data.
- Token never appears in API response.
- Invalid OAuth state rejected.
- Rate limit triggered correctly.
- Oversized request rejected.

---

## 17. الأداء وتجربة التحميل

### أهداف

- تقليل Initial Bundle.
- Lazy-load Analytics, Templates, Legal and heavy editors.
- فصل Firebase وRecharts حيث أمكن.
- Skeleton states.
- إلغاء الطلبات عند مغادرة الصفحة.
- Cache مستودعات GitHub والتحليلات.

### ميزانيات مبدئية

- Initial JS gzip أقل من 250–300 KB إن أمكن.
- الصفحات الثانوية Lazy-loaded.
- تفاعل الواجهة الأول خلال أقل من ثانيتين على اتصال جيد.
- AI requests تظهر Progress واضحاً ويمكن إلغاؤها.

---

## 18. التوطين وإمكانية الوصول

### اللغات

- العربية RTL.
- الإنجليزية LTR.
- الألمانية LTR.

### متطلبات

- عدم وجود نصوص Hard-coded خارج ملفات الترجمة إلا لسبب واضح.
- توحيد المصطلحات بين اللغات.
- اختبار RTL لكل صفحة.
- تواريخ وأوقات حسب Locale وTimezone.
- Keyboard navigation.
- Focus states واضحة.
- Labels للحقول.
- Contrast مناسب.
- عدم الاعتماد على اللون وحده لشرح الحالة.

---

## 19. Analytics المنتج الداخلية

يجب قياس رحلة الاستخدام، مع احترام الخصوصية.

### الأحداث الأساسية

- `signup_completed`
- `onboarding_completed`
- `github_connected`
- `linkedin_connected`
- `source_selected`
- `repository_analyzed`
- `angles_generated`
- `angle_selected`
- `post_generated`
- `post_edited`
- `ai_rewrite_used`
- `post_copied`
- `post_planned`
- `post_published`
- `second_post_created`
- `subscription_started`
- `subscription_cancelled`

### North Star Metric الأولية

> عدد المستخدمين الذين أنشؤوا منشوراً ثانياً خلال 14 يوماً.

### مؤشرات مساندة

- Time to First Value.
- Signup → First Post.
- First Post → Second Post.
- Weekly active creators.
- نسبة المستخدمين الذين يعدلون النص قبل النسخ.
- نسبة التحليلات الناجحة.
- تكلفة AI لكل مستخدم نشط.

### مؤشرات لا يجب الانخداع بها

- عدد التسجيلات وحده.
- عدد المنشورات المولدة دون نسخ أو استخدام.
- Page views دون إكمال الرحلة.
- عدد الميزات الموجودة.

---

## 20. الخطط والتسعير والفوترة

## 20.1 مبدأ التسعير

المستخدم لا يدفع مقابل Gemini أو عدد الأزرار؛ يدفع مقابل:

- استخراج قصص من عمله الحقيقي.
- توفير الوقت والتوتر.
- جودة وصِدق المحتوى.
- تنظيم الاستمرارية.
- عدم البدء من صفحة فارغة كل مرة.

## 20.2 نموذج أولي مقترح

### Free / Trial

- عدد محدود من تحليلات GitHub.
- عدد محدود من المنشورات والتحسينات.
- مستودعات عامة.
- محرر ومعاينة.
- Copy وPlanner.
- Branding خفيف اختياري ويجب اختباره قبل فرضه.

### Founding Pro

- سعر تجريبي تقريبي: 9–15 دولاراً شهرياً.
- حدود أعلى.
- مستودعات خاصة.
- Content Frameworks كاملة.
- Visual Cards.
- LinkedIn publishing Beta عند توفره.
- أولوية في Feedback والدعم.

### Pro لاحقاً

- سعر تقريبي: 19–25 دولاراً شهرياً بعد اكتمال القيمة المتكررة.
- GitHub Intelligence أقوى.
- History وInsights.
- Auto Publishing.
- LinkedIn Analytics المتاحة.

## 20.3 متطلبات Billing

- Stripe Checkout.
- Customer Portal.
- Webhooks موثقة التوقيع.
- Entitlements server-side.
- Trial lifecycle.
- Upgrade/Downgrade.
- Cancellation.
- Failed payment handling.
- Invoices.
- Tax/VAT consideration حسب مقر النشاط والعملاء.

## 20.4 Lifetime Deal

لا يعتمد في البداية بسبب:

- تكلفة AI المستمرة.
- عدم معرفة معدل استخدام المستخدم طويل الأمد.
- التزام دعم وصيانة دائم.
- صعوبة تسعير Limits عادلة قبل وجود بيانات.

يمكن إعادة تقييمه بعد معرفة تكلفة المستخدم ومعدل الاحتفاظ.

---

## 21. خطة الإطلاق والتوزيع العضوي

### المرحلة الأولى: Founder Usage

- استخدام المنتج أسبوعياً من قبل المؤسس.
- نشر المحتوى الناتج فعلياً.
- توثيق قبل/بعد.
- تسجيل المشاكل والوقت والجودة.

### المرحلة الثانية: Alpha

- 3–5 مستخدمين يشبهون المؤسس.
- جلسات استخدام مباشرة.
- لا يوجد دفع بالضرورة.
- التركيز على إكمال أول وثاني منشور.

### المرحلة الثالثة: Closed Beta

- 10–30 مستخدماً.
- Limits واضحة.
- Feedback داخل التطبيق.
- Founding plan اختيارية.
- مراقبة التكلفة والأخطاء.

### المرحلة الرابعة: Public Beta

- Landing Page صادقة.
- Pricing.
- Onboarding محسّن.
- دعم أساسي.
- نشر عضوي على LinkedIn وGitHub وFacebook والمجتمعات التقنية.

### المحتوى التسويقي العضوي

- Commit/Release → Post الناتج.
- كيف حول المؤسس مشروعه إلى حضور مهني.
- Build in Public.
- دروس من بناء المنتج.
- مقارنة بين Prompt عام وتحليل LinkedIn Authority.
- قصص مستخدمين حقيقية.

---

## 22. المراحل التنفيذية

## المرحلة 0 — تثبيت الحقيقة والاستقرار

**الهدف:** إزالة التناقض بين ما تعرضه الواجهة وما يعمل فعلياً.  
**المدة التقديرية:** 2–4 أيام عمل مركزة.

### المهام

- [ ] إصلاح جميع أخطاء TypeScript.
- [ ] إصلاح الاختبارات الأربعة الفاشلة أو تحديثها إذا أصبحت قديمة.
- [ ] توحيد أنواع Tabs وStatuses.
- [ ] إصلاح مسار LinkedIn Analytics بين العميل والخادم.
- [ ] حفظ LinkedIn Post ID بعد النشر.
- [ ] منع Metrics الوهمية مثل `98% SPEED` و`100K+`.
- [ ] تحديث FAQ والLanding والنصوص التي تعد بالنشر التلقائي.
- [ ] مراجعة Privacy وTerms لتطابق التنفيذ.
- [ ] تغيير اسم الحزمة وإصدارها.
- [ ] جعل CI يفشل عند فشل TypeScript أو الاختبارات.
- [ ] معالجة التنبيهات الأمنية الممكنة دون كسر المشروع.

### Definition of Done

- `npm run lint` ناجح.
- `npm test` ناجح بالكامل.
- `npm run build` ناجح.
- لا توجد وعود رئيسية غير منفذة.
- لا توجد بيانات Demo تظهر كبيانات مستخدم حقيقية.

---

## المرحلة 1 — الأمن وحماية التكلفة

**الهدف:** السماح باستقبال مستخدمين حقيقيين دون تعريض الحسابات أو فاتورة Gemini للخطر.  
**المدة التقديرية:** 1–2 أسبوع.

### المهام

- [ ] تهيئة Firebase Admin على الخادم.
- [ ] إضافة Auth middleware.
- [ ] إضافة API client يرسل Firebase ID Token.
- [ ] حماية جميع مسارات AI وLinkedIn.
- [ ] Input validation.
- [ ] Rate limiting حسب IP وUID.
- [ ] Usage metering.
- [ ] Plan limits server-side.
- [ ] نقل GitHub tokens للخادم.
- [ ] نقل LinkedIn tokens للخادم.
- [ ] تشفير التوكنات.
- [ ] إصلاح OAuth state وorigin.
- [ ] إخفاء الأسرار من Logs.
- [ ] إضافة Security headers.
- [ ] ضبط request size وtimeouts.

### Definition of Done

- الطلب غير الموثق يُرفض.
- المستخدم لا يستطيع استهلاك أكثر من حد خطته.
- لا تظهر التوكنات في Firestore المقروء من العميل.
- لا يظهر التوكن في Network response أو Console.
- OAuth state غير صحيحة تُرفض.

---

## المرحلة 2 — توحيد تجربة المنتج

**الهدف:** جعل المنتج يبدو كرحلة واحدة لا مجموعة صفحات قوية منفصلة.  
**المدة التقديرية:** 1–2 أسبوع.

### المهام

- [ ] بناء Home Dashboard باستخدام المكونات الموجودة.
- [ ] إعادة بناء Onboarding حول الهدف وأول نتيجة.
- [ ] جعل LinkedIn اختيارياً حتى وقت النشر.
- [ ] توحيد Create Flow.
- [ ] إضافة مصادر غير GitHub الأساسية.
- [ ] حفظ الهدف والجمهور مع المنشور.
- [ ] عرض ثلاث زوايا قبل التوليد.
- [ ] نقل GitHub إلى GitHub Studio واضح.
- [ ] تنظيم التنقل الرئيسي.
- [ ] توحيد Empty States.

### Definition of Done

- مستخدم جديد ينشئ أول منشور دون شرح خارجي.
- يمكن بدء Create من عدة أماكن لكن بنفس الرحلة.
- يمكن استخدام المنتج دون LinkedIn.
- GitHub يبقى أهم مصدر لكنه ليس المصدر الوحيد.

---

## المرحلة 3 — ترقية محرك المحتوى

**الهدف:** جعل الفرق عن ChatGPT محسوساً في النتيجة.  
**المدة التقديرية:** 1–3 أسابيع حسب العمق.

### المهام

- [ ] بناء Fact Extraction Schema.
- [ ] إضافة Releases وCommits وPRs كمصادر.
- [ ] اكتشاف Opportunities.
- [ ] Angle generation.
- [ ] Claim Inspector أساسي.
- [ ] ربط Frameworks بالتوليد.
- [ ] حفظ Source references.
- [ ] Secret/file filtering.
- [ ] Caching بحسب commit SHA.
- [ ] منع تكرار نفس قصة المحتوى.
- [ ] اختبارات Prompt وJSON parsing.

### Definition of Done

- كل منشور مبني على حقائق منظمة.
- لا ينتج النظام Metrics غير موثقة.
- يرى المستخدم سبب اقتراح الزاوية.
- يمكن تتبع المصادر الرئيسية للمنشور.

---

## المرحلة 4 — المحرر وإدارة المحتوى

**الهدف:** تحويل الناتج إلى محتوى يثق المستخدم أنه صوته ويمكنه إدارته.  
**المدة التقديرية:** 1–2 أسبوع.

### المهام

- [ ] تنظيم AI tools في أربع مجموعات.
- [ ] Before/After confirmation.
- [ ] Version history.
- [ ] Undo/Redo.
- [ ] Ready status.
- [ ] Archive.
- [ ] Search and filters.
- [ ] تحسين LinkedIn preview.
- [ ] Character/See-more insights.
- [ ] ربط البطاقة بالحقائق.

---

## المرحلة 5 — LinkedIn والنشر

**الهدف:** تكامل رسمي آمن وموثوق دون جعل المنتج رهينة له.  
**المدة:** تعتمد على API والموافقة والاختبارات.

### المهام

- [ ] تحديث Posts API.
- [ ] اختبار OAuth النهائي.
- [ ] نشر نصي موثوق.
- [ ] حفظ URN وPermalink.
- [ ] Token expiry handling.
- [ ] Copy/Open LinkedIn fallback.
- [ ] إصلاح Analytics data flow.
- [ ] تحديد Metrics المتاحة فعلياً.
- [ ] بناء Queue/Worker إذا اعتمد Auto Publish.
- [ ] Retry وIdempotency.

---

## المرحلة 6 — الفوترة والبيع

**الهدف:** تحويل المنتج من Beta إلى SaaS قابل للدفع.  

### المهام

- [ ] تعريف Free/Founding Pro/Pro.
- [ ] Stripe Checkout.
- [ ] Webhooks.
- [ ] Entitlements.
- [ ] Usage dashboard.
- [ ] Billing page.
- [ ] Trial lifecycle.
- [ ] Cancellation وCustomer Portal.
- [ ] رسائل تجاوز الحدود.
- [ ] مراجعة قانونية نهائية.

---

## المرحلة 7 — التعلم والنمو

**الهدف:** تطوير ما يثبت المستخدمون حاجتهم إليه.

### خيارات لاحقة تعتمد على البيانات

- [ ] Voice profile من منشورات سابقة.
- [ ] Weekly opportunity digest.
- [ ] Advanced performance insights.
- [ ] GitLab.
- [ ] Team collaboration.
- [ ] Repurposing.
- [ ] Browser extension.
- [ ] Custom Frameworks.
- [ ] Company pages.

لا تبدأ أي منها قبل وجود إشارة استخدام أو طلب واضح.

---

## 23. ترتيب الأولويات المختصر

### P0 — مانع إطلاق أو بيع

- فشل TypeScript والاختبارات.
- API بلا مصادقة.
- لا توجد Quotas.
- التوكنات في العميل وFirestore.
- OAuth غير آمن.
- ادعاءات ووظائف غير مطابقة للحقيقة.
- Analytics routing وPost ID.

### P1 — يصنع منتجاً متماسكاً

- Home Dashboard.
- Onboarding موجه بالهدف.
- Create Flow موحد.
- ثلاث زوايا.
- Fact extraction.
- Framework integration.
- Status model واضح.

### P2 — يرفع القيمة والاحتفاظ

- Releases/Commits opportunities.
- Version history.
- Claim Inspector.
- Calendar وReminder.
- Insights داخلية.
- Content history.

### P3 — نمو مستقبلي

- Auto Publishing.
- Advanced LinkedIn analytics.
- Voice DNA.
- Teams.
- Multi-platform.
- Browser extension.

---

## 24. قائمة ما سيبقى وما سيؤجل

### يبقى ويُقوّى

- Landing Page.
- Authentication.
- Onboarding.
- GitHub integration.
- Repositories/GitHub Studio.
- Generator/Create.
- Posts Hub.
- Editor.
- Visual Cards.
- Templates/Frameworks.
- Calendar.
- Analytics/Insights.
- Settings.
- Localization.
- Help and Legal.

### يعاد تقديمه بصدق

- Scheduling → Planner حتى يوجد Worker.
- Analytics → Internal + Connected Insights.
- LinkedIn publishing → Beta حتى يثبت.
- Predictive metrics → تزال أو تتحول إلى إرشادات غير رقمية.
- Security claims → تُكتب بعد تنفيذها فقط.

### يؤجل

- Teams وApprovals.
- Agencies.
- Multi-account.
- Multi-platform publishing.
- AI image generation.
- Advanced Voice DNA.
- Autonomous agents.
- Predictive reach scoring.
- Large template marketplace.
- Company pages.

### يحذف من المسار الأساسي

- Metrics الوهمية.
- Cynical style كخيار رئيسي.
- Tech Quiz كميزة مركزية.
- SEO Booster بصيغته الحالية.
- PAT manual entry للمستخدم الطبيعي.
- Diagnostics التقنية من الواجهة الأساسية.

---

## 25. سجل المخاطر

| الخطر | الاحتمال | الأثر | التخفيف |
|---|---|---|---|
| استهلاك Gemini دون حدود | عالٍ | عالٍ | Auth + Quotas + Rate limits |
| تسرب GitHub/LinkedIn token | عالٍ حالياً | حرج | Server-side encrypted tokens |
| تغير LinkedIn API | متوسط/عالٍ | عالٍ | API abstraction + copy fallback |
| رفض أو نقص صلاحيات Analytics | عالٍ | متوسط | Internal analytics layer |
| محتوى عام يشبه ChatGPT | عالٍ | عالٍ | Facts + angles + evidence |
| تضخم الميزات | عالٍ | متوسط | P0/P1 discipline + usage evidence |
| غياب المستخدمين رغم جودة المنتج | متوسط | عالٍ | Founder usage + closed beta |
| تكاليف Lifetime users | متوسط | عالٍ | عدم إطلاق LTD مبكراً |
| سياسات قانونية لا تطابق التنفيذ | عالٍ حالياً | عالٍ | Legal truth audit |
| تحليل ملفات حساسة | متوسط | حرج | Secret filtering + user preview |

---

## 26. معايير الجاهزية

## 26.1 Ready for Alpha

- الاختبارات وTypeScript ناجحة.
- الرحلة الأساسية تعمل.
- لا توجد بيانات Demo مضللة.
- حدود يدوية أو مغلقة للاستخدام.
- المؤسس يستطيع استخدام المنتج فعلياً أسبوعياً.

## 26.2 Ready for Closed Beta

- API authentication.
- Quotas.
- Tokens آمنة.
- Privacy مطابقة للتنفيذ.
- Error monitoring.
- Feedback channel.
- First-post flow واضح.

## 26.3 Ready for Paid Beta

- Entitlements server-side.
- Billing يعمل.
- Usage واضح.
- Cancel وrefund policy.
- دعم أساسي.
- لا توجد P0 bugs.
- تكلفة المستخدم معروفة تقريبياً.

## 26.4 Ready for Public Launch

- Onboarding مثبت مع مستخدمين حقيقيين.
- Second-post retention مقبول.
- Monitoring وbackups.
- LinkedIn features موصوفة بدقة.
- Legal and security review.
- Landing وPricing واضحتان.

---

## 27. Definition of Done العامة

أي ميزة تعتبر مكتملة فقط عندما:

- لها هدف مستخدم واضح.
- تعمل من الواجهة إلى قاعدة البيانات أو الخدمة الخارجية.
- تعالج Loading/Empty/Error/Success.
- لها Validation.
- تحترم الصلاحيات والخطة.
- لا تسرب أسراراً.
- لها اختبارات مناسبة للمخاطر.
- مترجمة في اللغات المدعومة.
- تعمل على Mobile وDesktop.
- موثقة.
- قياس استخدامها ممكن.
- النص التسويقي يصفها بدقة.

---

## 28. سجل القرارات المعتمدة

### ADR-PRODUCT-001 — هوية المنتج

**القرار:** LinkedIn content workspace للخبراء التقنيين، وGitHub محرك تميز رئيسي داخله.  
**ليس:** GitHub-only generator أو LinkedIn tool عامة بلا تخصص.

### ADR-PRODUCT-002 — الاحتفاظ بعمق SaaS

**القرار:** لا نحذف الصفحات المهمة لمجرد أن تنفيذها معقد؛ نكملها أو نعيد تسميتها بصدق.  
**مثال:** Calendar يبقى Planner إلى أن يوجد Auto Publish.

### ADR-PRODUCT-003 — LinkedIn ليس شرط البداية

**القرار:** يمكن للمستخدم إنشاء وتعديل وتخطيط المحتوى قبل ربط LinkedIn، ويُطلب الربط عند النشر.

### ADR-PRODUCT-004 — GitHub ليس المصدر الوحيد

**القرار:** دعم فكرة ونص وإنجاز مهني مع الحفاظ على GitHub كأقوى مصدر.

### ADR-PRODUCT-005 — الأدلة قبل الادعاءات

**القرار:** يمنع توليد Metrics أو نتائج غير موثقة، ويجب الفصل بين verified وinferred وuser-provided.

### ADR-PRODUCT-006 — الأمان قبل البيع العام

**القرار:** Auth وQuotas والتوكنات server-side شروط إطلاق، وليست ميزات مستقبلية.

### ADR-PRODUCT-007 — لا Lifetime Deal مبكراً

**القرار:** يؤجل حتى تتوفر بيانات تكلفة واحتفاظ حقيقية.

### ADR-PRODUCT-008 — التطوير بناءً على العودة

**القرار:** النجاح لا يقاس بعدد التسجيلات فقط؛ المؤشر الأهم هو إنشاء منشور ثانٍ خلال 14 يوماً.

---

## 29. قالب تحديث أسبوعي للخارطة

يضاف تحديث مختصر أسبوعياً:

```md
### أسبوع YYYY-MM-DD

#### ما اكتمل
- ...

#### ما قيد التنفيذ
- ...

#### ما تعطل ولماذا
- ...

#### ما تعلمناه من الاستخدام
- ...

#### قرارات جديدة
- ...

#### مؤشرات
- مستخدمون نشطون:
- منشورات أولى:
- منشورات ثانية خلال 14 يوماً:
- عمليات AI:
- تكلفة AI:
- أخطاء حرجة:
```

---

## 30. الخطوة التنفيذية التالية

يبدأ العمل من **المرحلة 0 — تثبيت الحقيقة والاستقرار** بهذا الترتيب:

1. إنشاء Issue/Task لكل خطأ TypeScript واختبار فاشل.
2. توحيد Status وTabs وأنواع Props.
3. إصلاح Analytics وLinkedIn Post ID.
4. إزالة Metrics والادعاءات الوهمية.
5. مراجعة Landing وFAQ وPrivacy.
6. إضافة Quality Gate يمنع نشر Build غير سليم.
7. بعد نجاح المرحلة 0، البدء فوراً بالمرحلة 1 الأمنية.

لا تبدأ إضافة صفحات أو Integrations جديدة قبل إغلاق P0.

---

## 31. الخلاصة المرجعية

LinkedIn Authority مشروع ذو فرصة حقيقية لأنه نشأ من مشكلة حقيقية، ولأن لديه بالفعل واجهة ومنظومة ميزات تتجاوز نموذج الـGenerator البسيط.

المطلوب ليس:

- هدم المنتج.
- اختزاله.
- إضافة عشرات الميزات.
- محاولة بناء منصة Enterprise منذ اليوم الأول.

المطلوب هو:

1. تثبيت الموجود.
2. حماية المستخدم والتكلفة.
3. توحيد الرحلة.
4. رفع جودة العقل الذي يصنع المحتوى.
5. إكمال LinkedIn بصدق وموثوقية.
6. قياس عودة المستخدم.
7. إضافة الدفع بعد إثبات القيمة المتكررة.

> الهدف النهائي: منتج يساعد الشخص الذي يبني فعلاً أن يظهر عمله للعالم باحتراف، دون أن يتحول إلى صانع محتوى متفرغ ودون أن يفقد صوته أو صدقه.


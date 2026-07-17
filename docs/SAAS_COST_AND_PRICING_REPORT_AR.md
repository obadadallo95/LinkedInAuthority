# التقرير المالي الشامل لتشغيل وإطلاق LinkedIn Authority

> مرجع تكاليف البنية التحتية، الذكاء الاصطناعي، Stripe، الضرائب، التشغيل، والتسعير قبل الإطلاق

**اسم المنتج:** LinkedIn Authority  
**نوع المنتج:** SaaS لصناعة وإدارة محتوى LinkedIn  
**تاريخ إعداد التقرير:** 17 يوليو/تموز 2026  
**العملة الأساسية:** اليورو EUR، مع إظهار الدولار عند تسعير المورد بالدولار  
**سعر الصرف المرجعي المستخدم:** 1 EUR ≈ 1.1467 USD  
**حالة الوثيقة:** تقدير تخطيطي حيّ يجب تحديثه قبل الإطلاق وعند تغير الأسعار  

---

## 1. هدف التقرير

يهدف هذا التقرير إلى الإجابة عن الأسئلة التالية:

- ما التكاليف اللازمة لإطلاق LinkedIn Authority كمنتج SaaS حقيقي؟
- ما التكاليف الثابتة الشهرية والسنوية؟
- ما تكلفة كل مستخدم وكل تحليل مستودع؟
- كم تقتطع Stripe من الاشتراك؟
- كيف تؤثر ضريبة القيمة المضافة VAT على الإيراد الحقيقي؟
- ما الخدمات الضرورية الآن وما الخدمات التي يمكن تأجيلها؟
- كم يحتاج المشروع عند 10 و100 و1,000 مشترك مدفوع؟
- ما السعر الذي يحافظ على هامش ربح آمن؟
- ما حدود الاستخدام المناسبة لكل خطة؟
- ما التكاليف المخفية التي لا تظهر عادة أثناء التطوير؟

هذا التقرير لا يعد استشارة ضريبية أو قانونية أو محاسبية. الضرائب وتسجيل النشاط والفوترة تختلف حسب بلد الإقامة القانونية للمالك، مكان تسجيل النشاط، وبلدان العملاء. يجب مراجعة محاسب أو مستشار ضرائب قبل قبول مدفوعات حقيقية.

---

## 2. الملخص التنفيذي

### النتيجة المختصرة

يمكن إطلاق LinkedIn Authority تقنياً بتكلفة نقدية شهرية منخفضة جداً إذا استُخدمت الخطط المجانية في البداية:

> **التشغيل التقني Lean قبل وجود مستخدمين: حوالي 10–30 يورو شهرياً.**

لكن التشغيل التجاري المحترف، مع بريد أعمال ومراقبة ونسخ احتياطي وأدوات قانونية/محاسبية، يحتاج ميزانية أكثر واقعية:

> **تشغيل تجاري مبكر: حوالي 40–150 يورو شهرياً، قبل راتب المؤسس والضرائب على الأرباح.**

وقد توجد تكاليف تأسيس لمرة واحدة:

> **تقريباً 100–1,500+ يورو** حسب بلد التسجيل، الاستعانة بمحامٍ، العلامة التجارية، ونوع الكيان القانوني.

### أهم النتائج

1. **Gemini ليست التكلفة الأكبر حالياً.** التحليل الكامل الحالي يكلف وسطياً قرابة 0.013 يورو، ويُنصح بحجز 0.03 يورو لكل تحليل كاحتياط.
2. **Firestore وFirebase Authentication غالباً سيبقيان ضمن الحدود المجانية في البداية.**
3. **Firebase App Hosting يحتاج Blaze billing، لكنه يملك حصصاً مجانية جيدة مع `minInstances: 0`.**
4. **Stripe هي تكلفة متغيرة مهمة:** رسوم الدفع + Stripe Billing + Tax إن استُخدم.
5. **VAT قد تكون أكبر اقتطاع من كل اشتراك.** سعر 15 يورو شامل VAT ألمانية 19% لا يعني إيراداً بقيمة 15 يورو؛ الإيراد قبل الضريبة حوالي 12.61 يورو.
6. **الحدود ضرورية حتى لو كانت خطة مدفوعة.** كلمة Unlimited دون Fair Use قد تسمح لمستخدم واحد باستهلاك عشرات أضعاف قيمة اشتراكه.
7. **السعر المنخفض جداً ليس ضرورياً.** تكلفة AI صغيرة، لكن الدعم والتطوير والفوترة والضرائب والوقت هي التكاليف الحقيقية.

### التوصية السعرية الأولية

- **Free/Trial:** محدود جداً، لا يفتح استهلاكاً مستمراً.
- **Founding Pro:** 12–15 يورو شهرياً.
- **Pro بعد استقرار LinkedIn والذكاء:** 19–25 يورو شهرياً.
- عدم تقديم Lifetime Deal قبل معرفة تكلفة المستخدم والاحتفاظ لمدة 3–6 أشهر على الأقل.

---

## 3. افتراضات الحساب

تعتمد الأرقام في هذا التقرير على الافتراضات التالية:

### البنية الحالية

- React/Vite frontend.
- Node.js/Express backend.
- Firebase App Hosting.
- Cloud Run بصورة غير مباشرة عبر App Hosting.
- Firestore Standard.
- Firebase Authentication.
- Gemini Developer API.
- GitHub API.
- LinkedIn API.
- Stripe Checkout + Billing المقترحة.

### إعدادات الاستضافة الحالية

```yaml
runConfig:
  concurrency: 80
  minInstances: 0
  cpu: 1
  memoryMiB: 512
```

وجود `minInstances: 0` مهم لأنه يسمح للخدمة بالنزول إلى الصفر عند عدم وجود طلبات، ما يقلل تكلفة Cloud Run، مقابل احتمال Cold Start.

### استخدام المستخدم المدفوع المفترض

سيناريو المستخدم المتوسط شهرياً:

- 30 تحليلاً كاملاً للمستودعات/المصادر.
- 30 عملية Hashtag مشمولة ضمن تقدير التحليل الكامل.
- 30–60 عملية تحسين أو إعادة كتابة مستقبلية.
- 20 جلسة استخدام.
- 50–200 قراءة Firestore في الجلسة بحسب التصميم.
- 5–20 عملية كتابة/تعديل في الجلسة.
- 5–20 رسالة بريد Transactional شهرياً.

### سعر الصرف

استخدم التقرير سعراً مرجعياً تقريبياً:

```text
1 EUR ≈ 1.1467 USD
1 USD ≈ 0.8721 EUR
```

يجب إضافة احتياط 5–10% لتغير سعر الصرف ورسوم البطاقات أو البنك عند دفع فواتير Google بالدولار.

---

## 4. تصنيف التكاليف

### 4.1 تكاليف ثابتة

تُدفع حتى لو لم يوجد مستخدمون:

- الدومين.
- البريد التجاري.
- بعض أدوات الخصوصية والقانون.
- المحاسب أو برنامج المحاسبة.
- بعض خطط المراقبة.
- تأمين مهني اختياري.
- تسجيل النشاط والتجديدات.

### 4.2 تكاليف متغيرة

تزداد مع الاستخدام أو الإيراد:

- Gemini tokens.
- Cloud Run CPU/memory/requests بعد الحصة المجانية.
- App Hosting bandwidth.
- Firestore reads/writes/storage بعد الحصة المجانية.
- رسائل البريد بعد الحصة المجانية.
- Stripe Payments.
- Stripe Billing.
- Stripe Tax.
- Refunds وchargebacks.
- دعم العملاء.

### 4.3 تكاليف لمرة واحدة

- تسجيل النشاط.
- صياغة أو مراجعة قانونية.
- شراء شعار أو تصميم إن تم outsourcing.
- تسجيل علامة تجارية اختياري.
- Penetration test اختياري قبل العقود الكبيرة.
- شراء دومين Premium إن اختير اسم مكلف.

### 4.4 تكاليف غير نقدية

هذه أهم من كثير من الفواتير، لكنها لا تظهر في كشف البنك:

- وقت التطوير.
- الدعم والرد على المستخدمين.
- مراقبة الأعطال.
- تحديث LinkedIn API.
- مراجعة مخرجات AI.
- معالجة الاستردادات والاعتراضات.
- المحاسبة والضرائب.
- كتابة الوثائق والتسويق العضوي.

---

## 5. تكلفة الدومين وDNS وSSL

### المطلوب

- دومين أساسي مثل `.com` أو `.io` أو `.app`.
- DNS.
- SSL/TLS.
- حماية DNSSEC.
- تجديد تلقائي.
- بريد على الدومين أو خدمة Forwarding.

### التكلفة التقديرية

| البند | تكلفة سنوية تقريبية | ملاحظات |
|---|---:|---|
| `.com` عادي | €10–20 | حسب المسجل والضرائب |
| `.app` | €15–30 | يختلف حسب المسجل |
| `.io` | €35–70+ | أعلى كلفة عادة |
| دومين Premium | قد يصل لمئات/آلاف | لا يُنصح به في البداية |
| DNS Cloudflare | €0 | الخطة المجانية كافية |
| SSL عبر Firebase/Cloudflare | €0 | لا حاجة لشراء شهادة منفصلة |
| WHOIS privacy | €0 غالباً | حسب المسجل وTLD |

### التوصية

- استخدام Cloudflare Registrar إن كان الامتداد مدعوماً، لأنه يبيع عادة بسعر registry دون markup.
- شراء دومين رئيسي واحد فقط في البداية.
- شراء امتدادات إضافية فقط إذا كان هناك خطر Brand واضح.
- تفعيل Auto-renew و2FA وRegistrar Lock وDNSSEC.

### ميزانية التقرير

```text
ميزانية سنوية آمنة للدومين: €15–30
تكلفة شهرية محاسبية: €1.25–2.50
```

---

## 6. Firebase App Hosting وCloud Run

Firebase App Hosting يتطلب Blaze pay-as-you-go، حتى لو بقي الاستخدام داخل الحصة المجانية.

### الحصص والأسعار المرجعية الحالية

| المورد | حصة مجانية شهرية | السعر بعد الحصة |
|---|---:|---:|
| App Hosting bandwidth | 10 GiB | $0.15 cached / $0.20 uncached لكل GiB |
| Cloud Run CPU | 180,000 vCPU-seconds | $0.000024 لكل vCPU-second |
| Cloud Run memory | 360,000 GiB-seconds | $0.0000025 لكل GiB-second |
| Cloud Run requests | 2 مليون طلب | $0.40 لكل مليون بعد الحصة |
| Cloud Build | 2,500 build-minute | $0.006 لكل دقيقة بعد الحصة |
| Cloud Logging | 50 GiB | $0.50 لكل GiB بعد الحصة |
| Artifact Registry | 0.5 GB | $0.10 لكل GB شهرياً بعد الحصة |

### وضع المشروع الحالي

لأن `minInstances: 0` وذاكرة الخادم 512 MiB، من المرجح أن تكون التكلفة:

| المرحلة | تقدير شهري |
|---|---:|
| تطوير/Alpha | €0–5 |
| 10 مشتركين | €0–5 |
| 100 مشترك | €0–15 |
| 1,000 مشترك | €20–150 تقريباً |

التكلفة الفعلية تعتمد على:

- مدة كل طلب Gemini.
- هل Cloud Run يبقى محجوز CPU أثناء انتظار Gemini؟
- عدد الطلبات المتزامنة.
- حجم ملفات JavaScript والصور.
- Cache hit ratio في CDN.
- كمية Logging.
- عدد مرات النشر والبناء.

### مخاطر الفاتورة

- Blaze ليس اشتراكاً ثابتاً؛ الفاتورة مفتوحة حسب الاستخدام.
- Budget Alerts تنبه ولا توقف الخدمة تلقائياً دائماً.
- هجوم على API غير محمي قد يولد فاتورة Gemini وCloud Run.
- Logging المفرط قد يصبح مكلفاً.
- Loop في worker أو scheduling قد يكرر الطلبات.

### إجراءات التحكم

- Firebase Auth على كل API.
- Rate limiting.
- Quotas لكل مستخدم.
- Cloud Billing budgets عند €10، €25، €50، €100.
- Logging sampling وعدم تسجيل Bodies الحساسة.
- App Check حيث يناسب.
- مراقبة request count وCPU وegress.
- عدم رفع `minInstances` قبل ظهور حاجة فعلية.

### الميزانية المقترحة

```text
قبل الإطلاق: €0–5 شهرياً
Beta صغيرة: احتياط €10 شهرياً
100 مستخدم مدفوع: احتياط €20–30 شهرياً
1,000 مستخدم مدفوع: احتياط €100–200 شهرياً حتى تتوفر بيانات حقيقية
```

---

## 7. Firestore

### ما يتم تخزينه حالياً أو مستقبلاً

- User profiles.
- Settings.
- Posts and drafts.
- Templates.
- Usage records.
- Integration metadata.
- Subscription entitlements.
- Analytics events المختصرة.
- Jobs وجدولة.

### الحصة المجانية اليومية التقريبية

- 50,000 document reads يومياً.
- 20,000 document writes يومياً.
- 20,000 deletes يومياً.
- 1 GB storage.

### الأسعار المرجعية في Firestore Standard

تختلف حسب المنطقة. الأسعار النموذجية قد تكون تقريباً:

- Reads: $0.03–$0.06 لكل 100,000.
- Writes: $0.09–$0.18 لكل 100,000.
- Deletes: $0.01–$0.02 لكل 100,000.
- Storage: حوالي $0.18/GB شهرياً في أمثلة Google لبعض المناطق.

### التقدير للمشروع

| المرحلة | تقدير شهري |
|---|---:|
| 10 مستخدمين | €0 |
| 100 مستخدم | €0–3 |
| 1,000 مستخدم | €3–30 |
| 10,000 مستخدم | يعتمد على listeners والتصميم؛ قد يصبح عشرات/مئات اليورو |

### ما قد يرفع التكلفة

- `onSnapshot` listeners كثيرة ومفتوحة.
- إعادة تحميل قائمة المنشورات كاملة لكل تعديل.
- مستندات ضخمة تحتوي Version History كاملة.
- تخزين Analytics events بشكل غير مجمع.
- Queries بلا pagination.
- Indexes كثيرة.
- الاحتفاظ بمحتوى مستودعات كامل.

### تحسينات مطلوبة

- Pagination للمحتوى.
- فصل versions في collection فرعية.
- تخزين facts لا ملفات المستودع كاملة.
- Aggregated counters.
- إغلاق listeners عند عدم الحاجة.
- Server timestamps.
- TTL للبيانات المؤقتة.
- مراجعة indexes.

### ميزانية التقرير

```text
Beta: €0–5 شهرياً
100–1,000 مستخدم: احتياط €5–30 شهرياً
```

---

## 8. Firebase Authentication

### Providers المستخدمة

- Google.
- GitHub.
- LinkedIn بصورة منفصلة/مخصصة.

### الأسعار المرجعية

Firebase Authentication على Blaze يتضمن عادة 50,000 MAU مجاناً لمزودي Email/Social/Anonymous/Custom، ثم تكلفة لكل MAU فوق الحد. SAML وOIDC Enterprise لهما نموذج مختلف.

### التقدير

| المستخدمون النشطون شهرياً | التكلفة المتوقعة |
|---:|---:|
| 100 | €0 |
| 1,000 | €0 |
| 10,000 | €0 |
| 50,000 | غالباً ضمن الحد الأساسي |

### تكاليف غير مباشرة

- SMS MFA أو Phone Auth يمكن أن يكون مكلفاً.
- لا يُنصح باستخدام SMS في البداية إلا لسبب ضروري.
- Email verification/password reset قد يحتاج خدمة بريد موثوقة بحسب التدفق.

### ميزانية التقرير

```text
€0 شهرياً في المراحل المبكرة
```

---

## 9. Gemini API

## 9.1 النموذج الحالي

الخادم يستخدم:

- Primary: `gemini-3.5-flash`.
- Fallback: `gemini-3.1-flash-lite`.
- Hashtags: `gemini-3.5-flash`.

### الأسعار الحالية لكل مليون Token

| النموذج | Input | Output بما فيه Thinking |
|---|---:|---:|
| Gemini 3.5 Flash | $0.75 | $4.50 |
| Gemini 3.1 Flash-Lite | $0.25 | $1.50 |

## 9.2 تكلفة التحليل الحالي

التحليل الحالي يرسل تقريباً:

- System prompt.
- JSON schema.
- وصف المستودع.
- `package.json` dependencies.
- أول 4,000 حرف من README أو ملفات مخصصة.
- تعليمات اللغة والنبرة والقالب.

### التكلفة المقدرة

| السيناريو | التكلفة بالدولار | باليورو تقريباً |
|---|---:|---:|
| اقتصادي | $0.0055 | €0.0048 |
| متوسط دون hashtags | $0.0116 | €0.0101 |
| متوسط كامل مع hashtags | $0.0144 | €0.0126 |
| طلب ثقيل | $0.03 تقريباً | €0.0262 |

### القاعدة المحاسبية

```text
التكلفة المتوقعة للتحليل الكامل: €0.013
الميزانية الآمنة للتحليل الكامل: €0.03
```

## 9.3 تكلفة المستخدم حسب حدود الخطة

| التحليلات شهرياً | متوقع | احتياط آمن |
|---:|---:|---:|
| 5 | €0.06 | €0.15 |
| 15 | €0.19 | €0.45 |
| 30 | €0.38 | €0.90 |
| 60 | €0.76 | €1.80 |
| 100 | €1.26 | €3.00 |

## 9.4 عمليات إعادة الكتابة المستقبلية

تقدير العملية الواحدة:

- تحسين بسيط عبر Flash-Lite: €0.001–0.004.
- إعادة كتابة عبر 3.5 Flash: €0.003–0.015 حسب Thinking والطول.

ميزانية آمنة لـ60 عملية تحسين شهرياً:

```text
€0.30–0.90 لكل مستخدم
```

## 9.5 التكلفة الكاملة المتوقعة للـAI لكل مستخدم

لمستخدم Pro متوسط:

```text
30 تحليلاً كاملاً:   €0.38 متوقع / €0.90 آمن
60 عملية تحسين:      €0.20–0.90
إعادة محاولات وفشل:  €0.05–0.20
----------------------------------
المتوقع:             €0.60–1.00
الاحتياط الآمن:      €1.50–2.00
```

### تحذير Unlimited

إذا منح المستخدم استخداماً غير محدود دون Fair Use:

- 1,000 تحليل = نحو €12.60 متوقع، وربما €30 وفق الميزانية الآمنة.
- هذا قد يستهلك كامل اشتراك بقيمة €15 أو أكثر.

لذلك يجب أن تكون الحدود على الخادم، وليس مجرد نص في صفحة التسعير.

## 9.6 ما يجب تسجيله لكل طلب

- Model.
- Prompt tokens.
- Candidate tokens.
- Thinking tokens.
- Total tokens.
- Estimated cost.
- User ID.
- Operation type.
- Repository/source ID.
- Request ID.
- Success/failure.

بدون `usageMetadata` تبقى التقديرات تقريبية ولا يمكن حساب هامش الربح الحقيقي.

---

## 10. GitHub API

### التكلفة المباشرة

GitHub REST API لا تتطلب دفعاً لكل طلب في الاستخدام الحالي، لكنها تفرض Rate Limits.

### التكاليف الممكنة

- GitHub App registration: عادة لا توجد رسوم أساسية.
- GitHub organization أو private repositories تخص المستخدم نفسه، وليست تكلفة عليك غالباً.
- Webhooks: لا رسوم مباشرة، لكن معالجة الطلبات تستهلك Cloud Run/Firestore.
- تخزين Cache وتحليلات المستودعات.

### المخاطر

- استخدام PAT بدلاً من GitHub App.
- Shared rate limit للطلبات غير الموثقة.
- تحليل Monorepo كبير.
- تكرار جلب الملفات نفسها.
- تخزين أو إرسال أسرار.

### الميزانية

```text
تكلفة API مباشرة: €0
تكلفة بنية غير مباشرة: مشمولة ضمن Hosting/Firestore/Gemini
```

---

## 11. LinkedIn API

### التكلفة المباشرة

لا توجد حالياً رسوم per-request واضحة للاستخدام الأساسي لصلاحيات Consumer المفتوحة مثل Sign In وShare on LinkedIn، لكن الوصول والميزات خاضعة لموافقة وسياسات LinkedIn.

### التكاليف الحقيقية

- وقت صيانة OAuth.
- تحديث API versions.
- اختبار النشر.
- معالجة انتهاء التوكن.
- Queue/worker للجدولة.
- دعم المستخدم عند فشل الصلاحيات.
- مراقبة تغييرات LinkedIn وسياساتها.

### المخاطر المالية

- بناء Analytics لا يمكن استخدامها بسبب نقص الصلاحيات.
- زيادة الدعم بسبب انتهاء التوكن.
- فشل النشر وإعادة المحاولة المتكررة.
- اعتماد المنتج الكامل على API يمكن أن تتغير.

### الميزانية

```text
تكلفة API المباشرة: غالباً €0
احتياط تطوير وصيانة: وقت المؤسس، وليس فاتورة API
```

---

## 12. Stripe Payments وBilling

## 12.1 المكونات المطلوبة

- Stripe Checkout.
- Stripe Customer Portal.
- Stripe Billing subscriptions.
- Webhooks.
- Products and Prices.
- Coupons اختيارياً.
- Refund handling.
- Tax calculation بحسب القرار الضريبي.
- Invoices/receipts.

## 12.2 رسوم Stripe المرجعية في ألمانيا/EEA

### Payments

- بطاقة EEA عادية: **1.5% + €0.25** لكل عملية ناجحة.
- بطاقة EEA Premium: **1.9% + €0.25**.
- بطاقة UK: **2.5% + €0.25**.
- بطاقة دولية أخرى: قد تصل إلى **3.25% + €0.25**.
- تحويل عملة: قد يضيف **2%**.
- SEPA Direct Debit: قرابة **€0.35** للعملية وفق صفحة الأسعار الحالية.
- Dispute: قد تصل الرسوم إلى €20 في بعض الحالات/الأسواق وفق صفحة Stripe الألمانية الحالية.

### Stripe Billing

- Pay as you go: **0.7% من Billing volume**.
- لا حاجة لخطة €500 شهرياً في المرحلة المبكرة.

### Stripe Tax

- Tax Basic no-code مع Billing/Checkout: قرابة **0.5% لكل معاملة** حيث يتم حساب الضريبة.
- API integration قد تكون برسوم ثابتة تقارب **€0.45 للمعاملة** حسب نوع التكامل والسوق.
- Tax Complete أو خطط متقدمة ليست ضرورية غالباً في البداية.

يجب التحقق من Dashboard الخاص بحساب Stripe لأن السعر يعتمد على بلد تسجيل الحساب والمنتجات المفعلة.

## 12.3 مثال اشتراك €15

### عميل EEA وبطاقة عادية

```text
سعر الاشتراك:                 €15.00
Stripe Payments 1.5%:        €0.225
رسوم ثابتة:                  €0.250
Stripe Billing 0.7%:         €0.105
Stripe Tax 0.5% اختياري:     €0.075
------------------------------------
الإجمالي دون Tax:            €0.580
الإجمالي مع Tax Basic:       €0.655
```

أي أن Stripe والخدمات المرتبطة قد تقتطع:

```text
3.87% تقريباً دون Tax
4.37% تقريباً مع Tax Basic
```

## 12.4 تأثير الرسوم الثابتة على الخطط الرخيصة

| السعر | Payments | Billing | Tax 0.5% | المجموع التقريبي |
|---:|---:|---:|---:|---:|
| €5 | €0.325 | €0.035 | €0.025 | €0.385 = 7.7% |
| €9 | €0.385 | €0.063 | €0.045 | €0.493 = 5.5% |
| €15 | €0.475 | €0.105 | €0.075 | €0.655 = 4.4% |
| €19 | €0.535 | €0.133 | €0.095 | €0.763 = 4.0% |
| €25 | €0.625 | €0.175 | €0.125 | €0.925 = 3.7% |

الاشتراكات الرخيصة تتأثر أكثر برسوم €0.25 الثابتة.

## 12.5 الاشتراك السنوي

الاشتراك السنوي يقلل عدد المعاملات ورسوم €0.25 الثابتة، ويحسن التدفق النقدي، لكنه يزيد:

- التزام تقديم الخدمة لعام.
- حجم Refund المحتمل.
- الحاجة إلى سياسة إلغاء واضحة.

اقتراح الخصم السنوي:

```text
خصم 15–20%، وليس 30–40% في البداية
```

---

## 13. VAT والضرائب على المبيعات الرقمية

## 13.1 لماذا VAT مهمة؟

إذا كان السعر المعروض للمستهلك الأوروبي شاملاً VAT، فالضريبة ليست إيراداً لك.

مثال ألمانيا 19%:

```text
سعر العميل الإجمالي: €15.00
الإيراد قبل VAT:      €15 / 1.19 = €12.605
VAT المحصلة:          €2.395
```

ثم تُطرح رسوم Stripe وتكلفة التشغيل من €12.605، لا من €15 اقتصادياً.

## 13.2 B2C وB2B

### B2C داخل الاتحاد الأوروبي

- قد تُحسب VAT حسب بلد العميل للخدمات الرقمية.
- قد يلزم OSS بعد تجاوز شروط/عتبات معينة.
- يجب جمع أدلة موقع العميل وفق المتطلبات المناسبة.

### B2B داخل الاتحاد الأوروبي

- قد ينطبق Reverse Charge عند وجود VAT ID صحيح.
- يجب التحقق من VAT ID وحفظ الدليل.

### خارج الاتحاد الأوروبي

- قد توجد Sales Tax/GST/VAT حسب الدولة والعتبات.

### Kleinunternehmer في ألمانيا

قد توجد قواعد إعفاء أو تبسيط حسب حجم النشاط وشروطه، لكنها لا تعني تلقائياً تجاهل ضرائب الخدمات الرقمية عبر الحدود. يجب سؤال Steuerberater عن الحالة الدقيقة.

## 13.3 Stripe Tax أم Merchant of Record؟

### Stripe + مسؤوليتك القانونية

المزايا:

- رسوم أقل.
- سيطرة أكبر.
- Checkout ممتاز.

العيوب:

- أنت البائع القانوني Merchant of Record.
- أنت مسؤول عن التسجيل والتحصيل والإقرار الضريبي.
- Stripe Tax يحسب الضريبة لكنه لا يحل كل واجبات التسجيل والتقديم تلقائياً في الخطة البسيطة.

### Merchant of Record مثل Paddle/Lemon Squeezy

المزايا:

- يتولى كثيراً من مسؤوليات VAT/Sales Tax والفوترة.
- أبسط لمؤسس فردي يبيع عالمياً.

العيوب:

- رسوم أعلى عادة.
- سيطرة أقل على المدفوعات.
- سياسات قبول ومخاطر حساب.

### القرار المطلوب قبل الإطلاق

- إذا كان الجمهور عالمياً والمحاسبة معقدة: قارن MoR مع Stripe بجدية.
- إذا كان النشاط مسجلاً والمحاسب يدير VAT/OSS: Stripe قد يكون أوفر.

---

## 14. البريد التجاري والبريد Transactional

## 14.1 البريد التجاري

يُفضل وجود:

- `hello@domain.com`
- `support@domain.com`
- `privacy@domain.com`
- `billing@domain.com`

يمكن أن تكون Aliases لصندوق واحد.

### Google Workspace

- Business Starter في ألمانيا يقارب €6.80 شهرياً مع التزام سنوي أو €8.10 تقريباً للخطة المرنة، حسب العرض والحساب.

### بدائل

- Zoho Mail.
- Proton Mail Business.
- Fastmail.
- Cloudflare Email Routing مع صندوق بريد خارجي.

### ميزانية

```text
€0 باستخدام Forwarding محدود
€6–10 شهرياً لصندوق تجاري احترافي واحد
```

## 14.2 البريد Transactional

الاستخدامات:

- Welcome.
- Subscription confirmation.
- Payment failed.
- Cancellation.
- Scheduled reminder.
- Security notice.
- Data export ready.

### Resend كمثال

- Free: 3,000 رسالة شهرياً، حد 100 يومياً.
- Pro: $20 شهرياً حتى 50,000 رسالة.
- Overage: $0.90 لكل 1,000 على الخطة المدفوعة.

### التوصية

- ابدأ بالخطة المجانية.
- افصل Marketing email عن Transactional email.
- اضبط SPF وDKIM وDMARC.
- لا ترسل Newsletter دون Consent واضح.

### ميزانية

```text
Alpha/Beta: €0
بعد تجاوز 3,000 رسالة: حوالي €17–20 شهرياً
```

---

## 15. المراقبة والأخطاء والـAnalytics

### الأدوات المطلوبة

- Error tracking.
- Uptime monitoring.
- Logs.
- Performance monitoring.
- Product analytics.
- Billing alerts.

### خيار اقتصادي

Better Stack Free يتضمن حالياً تقريباً:

- 10 monitors/heartbeats.
- Status page واحدة.
- 100,000 exception.
- 5,000 session replay.
- 3 GB logs لفترة احتفاظ قصيرة.

يمكن أيضاً استخدام:

- Google Cloud Logging المجاني ضمن الحصة.
- Firebase/Google Analytics مع مراعاة Consent وGDPR.
- Sentry Free.

### خيارات مدفوعة لاحقاً

- Monitoring responder: قرابة $29–34 شهرياً لبعض خطط Better Stack.
- Logs إضافية أو Error volume حسب الاستخدام.
- Product analytics مدفوعة عند زيادة الأحداث.

### التوصية

- Free monitoring قبل الإطلاق.
- Alert على `/api/health`.
- Alert على نسبة خطأ Gemini وLinkedIn.
- Alert على Stripe webhook failures.
- Alert على Cloud Billing budget.
- لا تسجل محتوى المستودعات أو التوكنات.

### ميزانية

```text
Beta: €0
تشغيل مبكر مدفوع: €0–30 شهرياً
```

---

## 16. النسخ الاحتياطي واستعادة البيانات

### المطلوب

- Firestore export مجدول.
- Retention policy.
- اختبار restore.
- نسخة من إعدادات Stripe products/prices في التوثيق.
- Source code على GitHub مع branch protection.
- Secrets recovery plan.

### تكلفة تقريبية

في البداية حجم البيانات صغير جداً:

```text
Storage/backup: €0–5 شهرياً
```

### ملاحظة مهمة

وجود Backup دون اختبار Restore لا يعد خطة استعادة.

### سياسة مقترحة

- Daily backup لمدة 7 أيام.
- Weekly backup لمدة 4 أسابيع.
- Monthly backup لمدة 6–12 شهراً عند الحاجة القانونية.
- تشفير وتقييد الوصول.

---

## 17. الأمان والخدمات المرتبطة

### الضروري دون شراء أدوات غالية

- Firebase Admin token verification.
- Server-side secrets.
- Google Secret Manager/KMS.
- Rate limiting.
- Dependency scanning.
- GitHub Dependabot.
- Secret scanning.
- CSP وsecurity headers.
- Cloudflare DNS/CDN.
- 2FA لكل الحسابات.
- Password manager.

### تكاليف ممكنة

| الخدمة | التقدير |
|---|---:|
| Password manager شخصي/فريق صغير | €0–5 شهرياً |
| Secret Manager | غالباً سنتات/ضمن استخدام منخفض |
| Cloudflare Free | €0 |
| Vulnerability scanning مفتوح المصدر | €0 |
| Pen test احترافي | €1,000–10,000+ لاحقاً |
| Bug bounty | يؤجل |

### التوصية

لا تحتاج SOC 2 أو Pen test مدفوع قبل وجود عملاء Enterprise، لكن تحتاج أساسيات الأمن قبل أول مستخدم مدفوع.

---

## 18. القانون والخصوصية والمحاسبة

هذه التكاليف تعتمد بشدة على بلد التسجيل.

### 18.1 تسجيل النشاط

إذا كان النشاط في ألمانيا مثلاً، قد تحتاج:

- Gewerbeanmeldung.
- Steuernummer.
- VAT ID عند الحاجة.
- Impressum.
- تسجيلات أو التزامات إضافية حسب الشكل القانوني.

ميزانية تسجيل أولية تقريبية لنشاط فردي بسيط:

```text
€20–60+ بحسب البلدية والحالة
```

تأسيس UG/GmbH أعلى بكثير بسبب رأس المال والكاتب العدل والسجل والمحاسبة.

### 18.2 المحاسب والضرائب

| الخيار | تقدير تقريبي |
|---|---:|
| برنامج فواتير/محاسبة بسيط | €10–30 شهرياً |
| Steuerberater لنشاط صغير | €50–250+ شهرياً أو حسب العمل |
| إقرار سنوي | يختلف بشدة |
| OSS/VAT متعدد الدول | قد يزيد التكلفة |

### 18.3 الوثائق القانونية

المطلوب:

- Privacy Policy.
- Terms of Service.
- Cookie Policy/Consent عند الحاجة.
- Impressum إذا انطبق القانون الألماني.
- DPA.
- Subprocessors list.
- Refund policy.
- Acceptable Use Policy.
- AI disclaimer.
- Data retention/deletion policy.

خيارات التكلفة:

```text
قوالب ذاتية ومراجعة محدودة: €0–100
مولد قانوني باشتراك: €10–50 شهرياً
مراجعة محامٍ: €300–1,500+
صياغة مخصصة معقدة: أعلى من ذلك
```

### 18.4 التأمين

اختياري في البداية لكنه يستحق التقييم:

- Professional liability.
- Cyber insurance.
- Legal protection.

ميزانية تقريبية:

```text
€15–80+ شهرياً بحسب التغطية والبلد
```

---

## 19. العلامة التجارية والتصميم

### تكاليف ممكنة

- Logo/brand إذا تم ذاتياً: €0.
- شراء خط أو صور: €0–200.
- تصميم احترافي outsourced: €300–3,000+.
- تسجيل علامة تجارية: رسوم حكومية واستشارية تختلف حسب النطاق والدول.
- Social assets: يمكن توليدها وتصميمها داخلياً.

### القرار

التصميم الحالي قوي؛ لا توجد ضرورة لإنفاق كبير قبل إثبات الاستخدام. الأولوية للأمان والرحلة والجودة.

---

## 20. الدعم وخدمة العملاء

### المرحلة الأولى

- بريد support.
- FAQ.
- Feedback form.
- GitHub Issues للمستخدمين التقنيين عند الحاجة.
- Help داخل التطبيق.

### تكلفة الأدوات

```text
Email support: ضمن البريد التجاري
Form بسيط: €0
Helpdesk مدفوع: €15–100+ شهرياً عند الحاجة
Chat widget: €0–50+ شهرياً
```

### تكلفة الوقت

إذا احتاج كل مستخدم مدفوع وسطياً 10 دقائق دعم شهرياً:

```text
100 مستخدم = 16.7 ساعة دعم شهرياً
1,000 مستخدم = 166.7 ساعة شهرياً
```

هذا يوضح لماذا لا يكفي حساب API فقط عند التسعير.

---

## 21. بيئات التطوير وCI/CD

### البيئات المطلوبة

- Local.
- Staging.
- Production.

### التكاليف

- GitHub private repository: قد يكون مجانياً للفرد ضمن الحدود.
- GitHub Actions: غالباً ضمن الحصة المجانية في البداية.
- Firebase staging project: غالباً €0–5.
- Preview environments: قد تزيد Cloud Build/Artifact storage.
- Test accounts: لا تكلفة كبيرة.

### التوصية

- مشروع Firebase منفصل لـStaging.
- مفاتيح Gemini منفصلة وحدود أقل.
- Stripe Test Mode منفصل.
- LinkedIn development app/redirect URIs منظمة.
- عدم استخدام بيانات مستخدمين حقيقية في Staging.

### ميزانية

```text
€0–10 شهرياً في البداية
```

---

## 22. جدول التكاليف الثابتة

## 22.1 النسخة Lean

| البند | شهري | سنوي |
|---|---:|---:|
| الدومين | €1.25–2.50 | €15–30 |
| Firebase/App Hosting | €0–5 | €0–60 |
| Firestore/Auth | €0 | €0 |
| بريد تجاري | €0–8 | €0–96 |
| Transactional email | €0 | €0 |
| Monitoring | €0 | €0 |
| Backup | €0–2 | €0–24 |
| Password manager | €0–5 | €0–60 |
| برنامج محاسبة | €0–20 | €0–240 |
| **المجموع** | **€1–42.50** | **€15–510** |

تقدير عملي غير متطرف:

```text
€10–30 شهرياً
```

## 22.2 تشغيل تجاري مبكر

| البند | شهري تقريبي |
|---|---:|
| Domain allocation | €2 |
| Firebase/Cloud احتياط | €10–30 |
| Google Workspace | €7–10 |
| Resend Pro عند الحاجة | €0 أو €17–20 |
| Monitoring | €0–30 |
| Backups | €2–5 |
| Password/security tools | €0–10 |
| Accounting software | €10–30 |
| Legal/privacy service | €0–30 |
| Accountant allocation | €0–250+ |
| **المجموع دون محاسب** | **€31–167** |
| **مع محاسب** | **€80–400+** |

### التوصية المالية

ميزانية تشغيل تقنية وتجارية مناسبة لأول 3 أشهر:

```text
€50–100 شهرياً دون مستشار دائم
احتياط إجمالي 3 أشهر: €300–600
```

---

## 23. تكلفة المستخدم الواحد

### مستخدم Pro متوسط

| البند | متوقع شهرياً | احتياط آمن |
|---|---:|---:|
| Gemini analysis | €0.38 | €0.90 |
| AI rewrites | €0.20–0.50 | €0.90 |
| Retry/failures | €0.05 | €0.20 |
| Hosting/Cloud Run allocation | €0.02–0.20 | €0.50 |
| Firestore | €0.00–0.05 | €0.15 |
| Email | €0.00–0.02 | €0.05 |
| Monitoring/logging allocation | €0.00–0.05 | €0.10 |
| **الإجمالي قبل Stripe** | **€0.65–1.20** | **€2.80** |

### القاعدة التجارية

استخدم في التخطيط:

```text
تكلفة بنية متغيرة متوقعة: €1 لكل مستخدم نشط مدفوع/شهر
تكلفة آمنة عند التسعير: €2.50–3 لكل مستخدم/شهر
```

هذا لا يشمل دعم المؤسس والمحاسبة والضرائب على الأرباح.

---

## 24. تحليل الإيراد الصافي حسب السعر

الجدول يفترض:

- السعر شامل VAT ألمانية 19% كمثال محافظ لـB2C.
- بطاقة EEA عادية.
- Stripe Payments + Billing + Tax Basic.
- تكلفة بنية متغيرة آمنة €2.50 لكل مستخدم.
- لا يشمل ضريبة الدخل/الشركات أو التكاليف الثابتة.

| السعر الإجمالي | الإيراد قبل VAT | رسوم Stripe التقريبية | البنية المتغيرة | المساهمة قبل الثابت/ضريبة الربح |
|---:|---:|---:|---:|---:|
| €9 | €7.56 | €0.49 | €2.50 | €4.57 |
| €12 | €10.08 | €0.58 تقريباً | €2.50 | €7.00 |
| €15 | €12.61 | €0.66 | €2.50 | €9.45 |
| €19 | €15.97 | €0.76 | €2.50 | €12.71 |
| €25 | €21.01 | €0.93 | €2.50 | €17.58 |

إذا كانت التكلفة الفعلية €1 فقط بدلاً من €2.50، يرتفع الهامش بـ€1.50 لكل مستخدم.

### النتيجة

- €9 يصلح كعرض Founding محدود، لكنه يترك هامشاً أقل للدعم.
- €12–15 توازن جيد للنسخة المبكرة.
- €19–25 منطقي بعد اكتمال GitHub Intelligence وLinkedIn reliability.

---

## 25. سيناريوهات الحجم

## 25.1 عشرة مشتركين مدفوعين

افتراض €15 شامل VAT لكل مشترك:

```text
Gross customer payments:          €150
Revenue before 19% VAT:           €126.05
Stripe + Billing + Tax:            ~€6.55
Variable infrastructure expected:  €10
Fixed technical/business lean:     €10–30
------------------------------------------------
Contribution before income tax:    ~€79–99
```

الهدف هنا ليس الربح الكبير، بل إثبات الدفع والاستخدام.

## 25.2 مئة مشترك مدفوع

```text
Gross customer payments:           €1,500
Revenue before 19% VAT:            €1,260.50
Stripe + Billing + Tax:             ~€65.50
Variable infrastructure expected:   €100
Fixed/operational tools:             €30–100
-------------------------------------------------
Contribution before support/tax:    ~€995–1,065
```

إذا استُخدم احتياط €2.50 للمستخدم بدلاً من €1:

```text
Variable infrastructure reserve: €250
Contribution: ~€845–915
```

## 25.3 ألف مشترك مدفوع

```text
Gross customer payments:           €15,000
Revenue before 19% VAT:            €12,605
Stripe + Billing + Tax:             ~€655
Variable infrastructure expected:   €1,000
Cloud/monitoring/email fixed growth: €100–300
Accounting/support/tools:            €200–1,000+
--------------------------------------------------
Contribution before salaries/tax:    ~€9,650–10,650
```

وفق الاحتياط الآمن €2.50 للمستخدم:

```text
Variable reserve: €2,500
Contribution before salaries/tax: ~€8,150–9,150
```

### تحذير

عند 1,000 مستخدم قد تصبح تكلفة الدعم والعمليات أكبر من Firestore وGemini معاً.

---

## 26. نقطة التعادل

معادلة مبسطة:

```text
Break-even users = Fixed monthly costs / Contribution per subscriber
```

مثال خطة €15:

- مساهمة محافظة بعد VAT وStripe والبنية: €9.45.

| التكاليف الثابتة | نقطة التعادل |
|---:|---:|
| €30 | 4 مشتركين |
| €100 | 11 مشتركاً |
| €250 | 27 مشتركاً |
| €500 | 53 مشتركاً |
| €1,000 | 106 مشتركين |

هذا لا يحسب راتب المؤسس.

إذا أراد المؤسس تعويض €2,000 شهرياً إضافة إلى €250 مصاريف:

```text
€2,250 / €9.45 ≈ 239 مشتركاً مدفوعاً
```

قبل ضريبة الدخل/الأرباح.

---

## 27. الخطط وحدود الاستخدام المقترحة

## Free

**الهدف:** إثبات القيمة، لا الاستخدام المستمر المجاني.

- 1–3 تحليلات تجريبية إجمالاً أو شهرياً.
- 5 منشورات/تحسينات.
- مستودعات عامة فقط.
- Copy وPreview.
- Drafts محدودة.
- لا Auto Publish.
- لا Private repositories.

تكلفة مستخدم Free متوقعة:

```text
€0.05–0.20
```

يجب منع إنشاء حسابات متعددة وإساءة الاستخدام بحدود IP/device مع احترام الخصوصية.

## Founding Pro — €12–15

- 30 تحليلاً شهرياً.
- 60 AI improvements.
- مستودعات خاصة.
- Visual cards.
- Frameworks.
- Planner.
- LinkedIn publishing Beta عند توفره.
- Usage history.

تكلفة متوقعة:

```text
€0.65–1.20
احتياط: €2.50
```

## Pro — €19–25

- 60 تحليلاً شهرياً.
- 150 AI improvements.
- GitHub opportunities.
- Releases/commits intelligence.
- Version history.
- LinkedIn publishing.
- Insights.
- Auto scheduling عند اكتماله.

احتياط التكلفة:

```text
€3–5 لكل مستخدم ثقيل
```

## Fair Use

حتى عند تسويق بعض الوظائف كغير محدودة:

- حد تقني يومي.
- حد شهري Soft/Hard.
- منع automation abuse.
- منع مشاركة الحساب.
- مراجعة الاستخدام غير الطبيعي.
- إمكانية شراء Credit packs لاحقاً.

---

## 28. الاشتراك الشهري مقابل السنوي

### اقتراح

| الخطة | شهري | سنوي مقترح |
|---|---:|---:|
| Founding Pro | €15 | €144–153 |
| Pro | €19 | €182–194 |
| Pro Plus | €25 | €240–255 |

هذا يعادل خصماً يقارب 15–20%.

### فوائد السنوي

- Cash flow أفضل.
- رسوم معاملات أقل.
- Churn أقل ظاهرياً.
- إمكانية تمويل التطوير.

### المخاطر

- التزام خدمة طويل.
- Refund أكبر.
- ضرورة توضيح التجديد التلقائي.
- قواعد حماية المستهلك الأوروبي.

---

## 29. الاستردادات والـChargebacks

### الاسترداد

Stripe لا يعيد عادة رسوم المعالجة الأصلية عند Refund في كثير من الحالات، حتى لو لم يفرض رسم Refund إضافياً.

### Disputes

- قد تكلف €15–20 أو أكثر حسب السوق والحالة.
- تحتاج أدلة: قبول الشروط، IP، invoice، usage logs، cancellation policy.

### الاحتياط المقترح

```text
حجز 1–3% من الإيراد للاستردادات والاعتراضات في التوقعات المبكرة
```

### تقليل المخاطر

- Trial واضحة.
- Reminder قبل التجديد السنوي.
- Customer Portal سهل.
- Cancel بنقرة.
- اسم واضح على كشف البطاقة.
- بريد Receipt وinvoice.
- دعم سريع.

---

## 30. التكاليف المخفية التي يجب عدم نسيانها

- VAT/Sales Tax.
- محاسب.
- تسجيل النشاط.
- Impressum وPrivacy وTerms.
- Currency conversion.
- Stripe Billing إضافة إلى Payments.
- Stripe Tax أو MoR.
- Refund fees غير المستردة.
- Chargebacks.
- رسائل البريد.
- Domain renewal وليس سعر السنة الأولى فقط.
- Backup storage.
- Logging growth.
- Staging environment.
- AI retries.
- Prompt thinking tokens.
- Abuse من مستخدمي Free.
- Bots وAPI attacks.
- دعم العملاء.
- وقت إصلاح LinkedIn integration.
- تكلفة ترجمة ومراجعة Legal باللغات المختلفة.
- Bank fees.
- Insurance.
- رسوم تحويل payout أو العملة.
- الضرائب على أرباح النشاط.
- أجهزة وبرامج العمل.
- استهلاك وقت المؤسس.

---

## 31. ما يجب شراؤه الآن وما يؤجل

## ضروري قبل الاشتراكات

- [ ] دومين رسمي.
- [ ] بريد أعمال أو forwarding موثوق.
- [ ] Firebase Blaze مع budgets.
- [ ] Gemini billing وحدود.
- [ ] Stripe account واختبار Checkout/Billing.
- [ ] نظام Usage/Entitlements على الخادم.
- [ ] Privacy/Terms/Refund policy مطابقة.
- [ ] تسجيل النشاط بحسب القانون.
- [ ] محاسبة وفواتير.
- [ ] Error/Uptime monitoring مجاني.
- [ ] Backup.
- [ ] Password manager و2FA.

## يمكن البدء مجاناً

- Firebase App Hosting ضمن الحصة.
- Firestore/Auth.
- Resend Free.
- Better Stack/Sentry Free.
- Cloudflare Free.
- GitHub API.
- LinkedIn API الأساسية.
- GitHub Actions ضمن الحصة.

## يؤجل

- Google Workspace متعدد المستخدمين.
- Helpdesk مدفوع.
- Monitoring مدفوع كبير.
- Dedicated IP للبريد.
- SOC 2.
- Pen test غالٍ.
- Trademark دولية واسعة.
- Stripe Tax Complete.
- خطط دعم Enterprise.
- Multi-region infrastructure.

---

## 32. ضوابط منع الفاتورة المفاجئة

### Google Cloud/Firebase

- [ ] Budget alerts عند €10/€25/€50/€100.
- [ ] Daily usage dashboard.
- [ ] `minInstances: 0` في البداية.
- [ ] Maximum instances مناسب.
- [ ] Request timeout.
- [ ] Log sampling.
- [ ] Egress monitoring.

### Gemini

- [ ] Auth middleware.
- [ ] Rate limit.
- [ ] Daily limit.
- [ ] Monthly entitlement.
- [ ] Max input chars/files.
- [ ] Store usageMetadata.
- [ ] Cost calculation per request.
- [ ] Kill switch لتعطيل AI مؤقتاً.
- [ ] Model routing.
- [ ] Cache analyses.

### Stripe

- [ ] Signed webhooks.
- [ ] Idempotency.
- [ ] Do not trust client plan state.
- [ ] Entitlements from server/webhook.
- [ ] Failed payment handling.
- [ ] Test clocks.
- [ ] Reconciliation شهري.

### Email

- [ ] Daily cap.
- [ ] Unsubscribe للتسويق.
- [ ] Bounce handling.
- [ ] SPF/DKIM/DMARC.

---

## 33. لوحة مالية يجب بناؤها داخلياً

يجب أن يستطيع المؤسس رؤية:

- MRR.
- Active paid subscribers.
- Trials.
- Churn.
- Stripe fees.
- VAT collected.
- Refunds.
- Gemini cost.
- Cloud cost.
- Cost per active user.
- Gross margin.
- AI operations per plan.
- Top 10 users by cost.
- Abuse alerts.

### معادلات أساسية

```text
Net revenue before profit tax
= Gross payments
- VAT/Sales tax
- Stripe Payments
- Stripe Billing
- Stripe Tax/MoR fee
- Refunds and disputes
```

```text
Gross margin
= Net revenue before profit tax
- Variable infrastructure
```

```text
Contribution margin per subscriber
= Net revenue per subscriber
- Variable cost per subscriber
```

---

## 34. ميزانية الإطلاق المقترحة

## سيناريو شديد الاقتصاد

### مرة واحدة

- Domain: €15–30.
- Business registration: €20–60+.
- Legal ذاتي/قوالب: €0–100.

### شهري

- Firebase/Gemini test use: €5–15.
- بريد/forwarding: €0–8.
- أدوات: €0–10.

```text
إطلاق أولي: €40–200 مرة واحدة
تشغيل: €10–30 شهرياً
```

## سيناريو احترافي واقعي لمؤسس فردي

### مرة واحدة

- Domain/brand: €20–100.
- Registration: €20–100+.
- Legal review: €300–1,000.
- Accounting setup: €50–300.

### شهري

- Cloud/AI reserve: €20–50.
- Workspace/email: €7–30.
- Monitoring/backup/tools: €5–30.
- Accounting/legal tools: €20–150+.

```text
إطلاق: €400–1,500+
تشغيل: €50–250+ شهرياً
```

### رأي التقرير

لا يلزم دفع €1,500 قبل أول مستخدم، لكن لا يجب قبول مدفوعات قبل معالجة تسجيل النشاط والضرائب والسياسات الأساسية.

احتياط نقدي منطقي لأول ستة أشهر:

```text
Lean: €500–1,000
Professional: €1,500–3,000
```

هذا لا يشمل راتب المؤسس.

---

## 35. القرار المقترح لـStripe

Stripe مناسب تقنياً للمشروع، خاصة مع:

- Checkout hosted.
- Billing.
- Customer Portal.
- Webhooks.
- SEPA/card support.

لكن قبل التنفيذ يجب حسم سؤال واحد:

> هل يريد المؤسس إدارة VAT/OSS والفوترة القانونية بنفسه مع محاسب، أم يريد Merchant of Record برسوم أعلى ومسؤولية أقل؟

### إذا اختير Stripe

يُنصح بالتكوين التالي:

- Stripe Checkout.
- Stripe Billing pay-as-you-go 0.7%.
- Customer Portal.
- Stripe Tax Basic بعد تأكيد المحاسب.
- أسعار باليورو.
- Monthly + annual price.
- Webhooks server-side.
- Entitlements server-side.
- Invoice/receipt emails.
- Refund and cancellation policy.
- لا تستخدم Connect؛ المنتج ليس Marketplace.

---

## 36. القرار السعري النهائي المقترح قبل Beta

### الخيار المحافظ

```text
Free Trial: 3 تحليلات
Founding Pro: €12/month
Founding Pro Annual: €120/year
```

### الخيار الأفضل لهامش ودعم أقوى

```text
Free Trial: 3 تحليلات
Founding Pro: €15/month
Founding Annual: €144/year
```

### بعد اكتمال الميزات الحرجة

```text
Pro: €19/month أو €190/year تقريباً
Pro Plus: €25/month عند وجود قيمة واضحة إضافية
```

### لماذا €15 مناسب كبداية؟

- أقل بكثير من أدوات LinkedIn الكبيرة.
- يترك هامشاً للدعم والضرائب.
- تكلفة AI أقل بكثير من السعر.
- مناسب لجمهور تقني قد يدفع مقابل توفير الوقت.
- يمكن تثبيته كFounding price للمستخدمين الأوائل.

---

## 37. قائمة تنفيذ قبل فتح الاشتراكات

### مالي وقانوني

- [ ] تحديد بلد وكيان تسجيل النشاط.
- [ ] سؤال محاسب عن VAT وOSS وB2B reverse charge.
- [ ] تحديد هل الأسعار تشمل VAT.
- [ ] إنشاء Impressum إن انطبق.
- [ ] مراجعة Privacy وTerms وRefund.
- [ ] إعداد نظام فواتير ومصالحة.
- [ ] فتح حساب بنكي/تجاري عند الحاجة.

### Stripe

- [ ] إنشاء Products/Prices.
- [ ] Monthly/Annual.
- [ ] Checkout.
- [ ] Portal.
- [ ] Signed webhooks.
- [ ] Test renewals/failures/cancellations/refunds.
- [ ] Tax configuration بعد استشارة.
- [ ] Statement descriptor.

### المنتج

- [ ] Usage metering.
- [ ] Server-side entitlements.
- [ ] Hard limits.
- [ ] Usage display للمستخدم.
- [ ] Upgrade/downgrade behavior.
- [ ] Grace period.
- [ ] Data behavior بعد الإلغاء.

### البنية

- [ ] Firebase budgets.
- [ ] Gemini usage logging.
- [ ] Rate limiting.
- [ ] Monitoring.
- [ ] Backup/restore test.
- [ ] Staging منفصل.
- [ ] Secret security.

---

## 38. مراجعة شهرية للتقرير

يجب تحديث الأرقام التالية كل شهر بعد الإطلاق:

```md
### شهر YYYY-MM

- المشتركين المدفوعين:
- MRR الإجمالي:
- VAT/Sales tax:
- Stripe Payments fees:
- Stripe Billing fees:
- Stripe Tax fees:
- Gemini tokens/cost:
- Firebase/Google Cloud cost:
- Email/monitoring cost:
- Refunds/disputes:
- متوسط تكلفة المستخدم:
- أعلى مستخدم تكلفة:
- Gross margin:
- Churn:
- دعم بالساعات:
- القرارات المطلوبة:
```

بعد ثلاثة أشهر من البيانات، يجب استبدال الافتراضات في هذا التقرير بأرقام فعلية.

---

## 39. مصادر الأسعار المرجعية

يجب إعادة التحقق منها قبل اتخاذ قرار مالي نهائي:

- Gemini Developer API Pricing: `https://ai.google.dev/gemini-api/docs/pricing`
- Firebase App Hosting Costs: `https://firebase.google.com/docs/app-hosting/costs`
- Firestore Pricing: `https://firebase.google.com/docs/firestore/pricing`
- Firebase Authentication: `https://firebase.google.com/docs/auth`
- Stripe Germany Pricing: `https://stripe.com/de/pricing`
- Resend Pricing: `https://resend.com/pricing`
- Google Workspace Pricing: `https://workspace.google.com/pricing`
- Better Stack Pricing: `https://betterstack.com/pricing`
- Cloudflare Registrar: `https://www.cloudflare.com/products/registrar/`
- ECB Exchange Rates: `https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/`

الأسعار تختلف حسب المنطقة، الضرائب، نوع البطاقة، عملة الدفع، والعروض المؤقتة.

---

## 40. الخلاصة النهائية

### تكلفة الإطلاق

```text
الحد التقني Lean: €10–30 شهرياً
تشغيل مبكر محترف: €50–150+ شهرياً
تأسيس ومراجعات لمرة واحدة: €100–1,500+ بحسب الحالة
```

### تكلفة المستخدم

```text
متوقع: حوالي €1 شهرياً من البنية والذكاء
احتياط تسعيري آمن: €2.50–3 شهرياً
```

### سعر الاشتراك

```text
Founding Pro الموصى به: €12–15 شهرياً
Pro بعد استقرار المنتج: €19–25 شهرياً
```

### أهم ثلاثة مخاطر مالية

1. API غير محمية أو Unlimited حقيقية تؤدي إلى فاتورة Gemini.
2. تجاهل VAT واعتبار السعر الإجمالي إيراداً صافياً.
3. حساب تكلفة API وإهمال الدعم والمحاسبة والقانون والصيانة.

### القرار العملي

يمكن إطلاق اشتراكات المنتج بميزانية صغيرة، لكن يجب قبلها إكمال:

- حماية API وحدود الاستخدام.
- نقل التوكنات للخادم.
- Usage metering.
- Stripe webhooks وentitlements.
- قرار VAT/Merchant of Record مع محاسب.
- سياسات قانونية مطابقة.
- مراقبة ونسخ احتياطي.

بعد ذلك، خطة بقيمة €15 شهرياً مع 30 تحليلاً و60 عملية تحسين تملك هامشاً جيداً جداً، حتى باستخدام افتراضات تكلفة محافظة، وتسمح للمنتج بالنمو دون بيعه بأقل من قيمته.


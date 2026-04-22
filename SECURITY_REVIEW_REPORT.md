# تقرير مراجعة المخاطر والتحسينات

تاريخ المراجعة: 2026-04-22

نطاق المراجعة شمل الخادم `server` وواجهات العملاء:
`client/club`, `client/team`, `client/super-admin`, `client/plyer`,
`client/sports-course`, `client/landing-page`, و`client/print`.

اعتمدت المراجعة على قراءة الكود، فحص إعدادات البيئة والاعتمادات، وتشغيل
`npm audit --omit=dev` على الحزم التي لديها `package-lock.json`.

## ملخص تنفيذي

المشروع يحتوي مخاطر أمنية وتشغيلية عالية قبل الإنتاج. أهمها أن عددا كبيرا من
عمليات GraphQL غير محمية فعليا لأن `@auth` مكتوبة كتعليق `#@auth`، مع وجود
mutations حساسة مفتوحة مثل `createUser` و`activeUser`. كذلك توجد مشكلة عزل
الصلاحيات بين الأندية والفرق لأن الخادم غالبا يثق في `idClub` و`idTeam`
القادمة من العميل، بينما فحص الصلاحيات موجود غالبا في الواجهة فقط.

يوجد أيضا خطر تشغيلي كبير بسبب تشغيل `DB.sync({ alter: true })` عند تحميل
الموديلات، ووجود ثغرات محدثة في الاعتمادات حسب `npm audit`، إضافة إلى تفعيل
`debug` و`introspection` في Apollo دائما.

## حرج جدا

- حماية GraphQL غير مفعلة على مساحات واسعة من النظام. كثير من الحقول مكتوبة
  بصيغة `#@auth(requires: user)` داخل schema، وهذه مجرد تعليق وليست directive.
  أمثلة واضحة في:
  - `server/src/Graphql/Schemas/Players.mjs`
  - `server/src/Graphql/Schemas/Members.mjs`
  - `server/src/Graphql/Schemas/League.mjs`
  - `server/src/Graphql/Schemas/Permission.mjs`
  - `server/src/Graphql/Schemas/Request.mjs`
  - `server/src/Graphql/Schemas/Blog.mjs`
  - `server/src/Graphql/Schemas/Form.mjs`
  - `server/src/Graphql/Schemas/Expense.mjs`
  - `server/src/Graphql/Schemas/Meeting.mjs`
  - `server/src/Graphql/Schemas/Stadium.mjs`
  النتيجة أن قراءات وتعديلات حساسة على لاعبين، أعضاء، صلاحيات، طلبات، مصروفات،
  مراسلات، ومرفقات قد تكون متاحة دون تحقق فعلي من الجلسة.

- `createUser` مفتوح بدون `@auth` في `server/src/Graphql/Schemas/User.mjs:18`.
  الـ resolver في `server/src/Graphql/Resolvers/User.mjs:306` ينشئ المستخدم من
  `...content`، ويستخدم `content.role`، ثم يضبط `activation: true` و
  `email_verify: true`. هذا يسمح بإنشاء حساب مفعل مباشرة إذا كانت mutation
  متاحة من الشبكة.

- `activeUser` مفتوح بدون `@auth` في `server/src/Graphql/Schemas/User.mjs:34`.
  هذا endpoint يستطيع تغيير حالة حساب مستخدم من غير حماية ظاهرة في schema.

- نظام الصلاحيات لا يفرض عزل tenant/ownership من جهة الخادم. أمثلة:
  `allPlayers(idTeam)` و`allPlayersClub(idClub)` في
  `server/src/Graphql/Resolvers/Players.mjs:31` و`:44` تقبل معرف الفريق أو النادي
  من العميل وتعيد البيانات بناء عليه. كذلك `allPermissionsClub` في
  `server/src/Graphql/Resolvers/Permission.mjs:28` يعيد صلاحيات بناء على `idClub`.
  الواجهات تستخدم `hasPermission` لإخفاء أزرار أو صفحات، لكن هذا لا يمنع استدعاء
  GraphQL مباشرة.

- `DB.sync({ alter: true, force: false })` يعمل عند تحميل
  `server/src/Models/index.mjs:292`. هذا خطر إنتاجي لأنه يسمح بتعديل schema
  تلقائيا مع تشغيل التطبيق، وقد يغير جداول أو أعمدة بدون مراجعة migration صريحة.

- نتائج `npm audit --omit=dev` تظهر ثغرات حرجة وعالية في كل حزمة رئيسية:
  - `server`: 27 ثغرة، منها 4 critical و14 high.
  - `client/club`: 33 ثغرة، منها 7 critical و8 high.
  - `client/team`: 34 ثغرة، منها 7 critical و9 high.
  - `client/super-admin`: 26 ثغرة، منها 5 critical و7 high.
  - `client/plyer`: 25 ثغرة، منها 5 critical و6 high.
  - `client/sports-course`: 64 ثغرة، منها 2 critical و31 high.
  - `client/print`: 67 ثغرة، منها 3 critical و30 high.
  - `client/landing-page`: 24 ثغرة، منها 2 critical و7 high.

## عالي

- Apollo Server مفعل بإعدادات غير مناسبة للإنتاج:
  `playground: true`, `introspection: true`, و`debug: true` في
  `server/src/app.mjs:75-77`. حتى مع تعطيل landing page في الإنتاج، بقاء
  introspection وdebug يعرض schema وتفاصيل أخطاء غير لازمة.

- لا توجد حدود query depth أو complexity. هناك تعليق فقط حول `depthLimit` في
  `server/src/app.mjs:80-82`. GraphQL بدون حدود قد يتعرض لاستعلامات عميقة أو
  مكلفة تؤدي إلى استنزاف الخادم وقاعدة البيانات.

- الأدوار غير متسقة. موديل المستخدم يعرف الأدوار كقيم رقمية
  `['1', '2', '3', '4']` في `server/src/Models/User.mjs:18-25`، بينما schema
  والـ auth directive ومنطق تسجيل الدخول يستخدمون أسماء مثل
  `admin`, `employee`, `supervisor`, `customer`, و`user`. هذا التضارب قد يكسر
  التفويض أو يجعل `@auth(requires: admin)` غير قابل للاعتماد.

- فحص صلاحية النادي ومدة العضوية موضوع داخل شرط
  `if (NODE_ENV === "development")` في `server/src/Graphql/Resolvers/User.mjs:252`.
  هذا يعني أن هذه القيود لا تعمل في الإنتاج حسب الكود الحالي، رغم أنها تبدو
  قيودا تجارية مهمة عند تسجيل الدخول.

- رفع الملفات يعتمد غالبا على امتداد الملف فقط، مثل
  `filename.split(".")` في resolvers متعددة، مع تخزين الملفات في `uploads`
  وخدمتها مباشرة من `/images` في `server/src/app.mjs:65`. يجب فحص MIME والمحتوى،
  منع الملفات النشطة، تنظيف الصور، وفصل الملفات الخاصة عن المسار العام.

- بعض endpoints الحساسة لا يظهر عليها rate limiting أو account lock:
  `authenticateUser`, `forgetPassword`, `resendVerificationEmail`,
  `changePassword`, و`refreshToken`. هذا يرفع خطر brute force وemail enumeration
  وإساءة استخدام البريد.

- رسائل الأخطاء تميز بين حالات تسجيل الدخول مثل `USER_NOT_EXIST`,
  `PASSWORD_INCORRECT`, `EMAIL_NOT_VERIFY`, و`ACCOUNT_NOT_ACTIVE` في
  `server/src/Graphql/Resolvers/User.mjs:231-249`. هذا يسهل معرفة حالة البريد
  أو الحساب.

- access token يمرر في header من Zustand داخل الواجهة، ويتم طباعته في أكثر من
  GraphQL client عند refresh token مثل `client/club/lib/graphql.ts` و
  `client/team/lib/graphql.ts` و`client/plyer/lib/graphql.ts`. حتى لو كان التخزين
  في الذاكرة فقط، طباعة token في console خطر أثناء الدعم أو التسجيل.

- refresh token في cookie جيد لأنه `httpOnly`، لكن لا يظهر وجود جدول جلسات أو
  تدوير refresh token أو إبطال token عند إعادة الاستخدام. الاعتماد على user-agent
  وحده في `sameUserAgent` ضعيف وممكن أن يسبب مشاكل شرعية للمستخدمين أو لا يمنع
  سرقة token بشكل كاف.

- secrets المحلية موجودة في ملفات `.env` متعددة لكنها مستثناة من git حسب
  `.gitignore` و`server/.gitignore`. يجب التأكد أنها لا تنتقل خارج الجهاز ولا
  تدخل النسخ الاحتياطية أو قنوات المشاركة. ملفات البريد تستخدم env حاليا، لذلك
  الخطر الرئيسي هو إدارة الأسرار المحلية وليس مفاتيح hardcoded داخل الكود.

## متوسط

- هناك اعتماد واسع على hardcoded URLs. أمثلة:
  روابط التحقق من البريد تشير إلى `http://localhost:3000` في
  `server/src/Helpers/Mail.mjs`، و`client/print/src/graphql/graphql.ts` يستخدم
  `https://api.omkooora.com` مباشرة، وكثير من ملفات codegen تشير إلى
  `https://api-employees.qafilaty.com/graphql`. هذا يسبب أخطاء بيئة وصعوبة نشر.

- يوجد تكرار كبير في عملاء GraphQL، auth helpers، permissions UI، والـ store بين
  `club`, `team`, `super-admin`, و`plyer`. هذا يزيد احتمال إصلاح مشكلة في واجهة
  ونسيان الواجهات الأخرى.

- توجد أكثر من طريقة lock للمديريات نفسها، مثل وجود `package-lock.json` و
  `yarn.lock` معا في `client/club`, `client/plyer`, و`client/super-admin`. هذا
  يجعل الإصدارات الناتجة مختلفة حسب أداة التثبيت.

- لا توجد تغطية اختبارات كافية. الموجود فقط `App.test.tsx` الافتراضي تقريبا في
  `client/sports-course` و`client/print`، ولا تظهر اختبارات للخادم أو GraphQL أو
  authorization أو upload.

- الاعتماد على `console.log` و`console.error` واسع في الخادم والواجهات، وبعضها
  يطبع بيانات تشغيل أو tokens أو أخطاء كاملة. هذا يضعف جودة المراقبة وقد يسرب
  معلومات في الإنتاج.

- `apollo-server-express@3` متوقف الصيانة، و`react-scripts@5` مستخدم في
  `sports-course` و`print`. الاعتمادات القديمة مرتبطة مباشرة بعدد كبير من نتائج
  `npm audit`.

- `DBContact.mjs` يثبت `host: 'localhost'` ولا يظهر إعداد SSL/TLS أو إعدادات DB
  مختلفة عبر env إلا للاسم والمستخدم وكلمة المرور. هذا يحد من قابلية النشر الآمن
  ويجعل بيئات staging/production أقل وضوحا.

## تحسينات مقترحة

1. أغلق كل mutations والقراءات الحساسة في GraphQL. حوّل `#@auth` إلى `@auth`
   بعد مراجعة كل endpoint، واجعل endpoints العامة محدودة جدا ومبررة.

2. اقفل `createUser` و`activeUser` فورا. إنشاء المستخدم وتفعيل الحساب يجب أن
   يكونا admin-only أو ضمن flow دعوات واضح، ولا تسمح بتمرير `role`,
   `activation`, أو `email_verify` من العميل.

3. أضف authorization مركزي على الخادم. كل resolver يجب أن يتحقق من أن المستخدم
   يملك النادي أو الفريق أو الصلاحية المطلوبة، ولا يعتمد على إخفاء الأزرار في
   الواجهة.

4. وحّد نموذج الأدوار والصلاحيات. اختر أسماء ثابتة أو أرقاما ثابتة، وطبقها في
   DB model، GraphQL enum، auth directive، والواجهات.

5. أوقف `DB.sync({ alter: true })` في runtime واستبدله بنظام migrations واضح
   مثل Sequelize migrations أو Umzug، مع مراجعة migration قبل الإنتاج.

6. عطّل `debug`, `introspection`, وGraphQL playground في الإنتاج، وأضف query
   depth/complexity limits وrequest size limits مناسبة.

7. أضف rate limiting وaccount lock مؤقت لمحاولات الدخول واسترجاع كلمة المرور
   وإرسال البريد وتجديد token.

8. قو ملفات الرفع: تحقق من MIME والمحتوى السحري للملف، حوّل الصور بصيغة آمنة،
   امنع SVG/HTML، افصل الملفات الخاصة عن public static، وأضف فحصا للملفات
   المكتبية أو قيودا أقوى عليها.

9. عالج `npm audit` بالأولوية: ابدأ بالخادم ثم واجهات `club/team/super-admin`.
   غالبا ستحتاج ترقية Apollo Server، Next.js، react-scripts أو نقل مشاريع CRA
   إلى Vite، وتحديث حزم GraphQL وSocket وJWT.

10. وحّد إعدادات API والروابط عبر env فقط. اجعل روابط البريد والطباعة وcodegen
    مبنية على متغيرات بيئة، وأضف `.env.example` لكل تطبيق.

11. احذف logs الحساسة واستبدلها بـ logger موحد مع redaction للـ tokens وكلمات
    المرور وبيانات المستخدم الحساسة.

12. أضف اختبارات مركزة قبل أي إصلاح كبير:
    - اختبارات authorization لكل role وكل tenant.
    - اختبارات تسجيل الدخول وتجديد token.
    - اختبارات upload.
    - اختبارات تمنع الوصول إلى بيانات نادي أو فريق آخر.

## أولوية العمل المقترحة

1. إغلاق `createUser` و`activeUser` وتفعيل auth على endpoints الحساسة.
2. إضافة tenant authorization في resolvers التي تقبل `idClub` و`idTeam`.
3. إيقاف `DB.sync({ alter: true })` وتجهيز migrations.
4. تعطيل إعدادات Apollo الخطرة وإضافة query limits.
5. معالجة ثغرات `npm audit` الحرجة والعالية.
6. تقوية upload وsession/rate limiting.
7. توحيد env والروابط وإزالة hardcoded URLs.
8. إضافة اختبارات أمنية وتشغيلية أساسية.

## ملاحظات تشغيلية

- ملف `SECURITY_REVIEW_REPORT.md` نفسه غير متتبع حاليا في git حسب حالة العمل.
- ملفات `.env` المحلية مستثناة من git، وهذا جيد، لكن يجب عدم إرسالها يدويا أو
  ضغطها ضمن أرشيف المشروع.
- المراجعة لم تغير كود التطبيق، بل وثقت المخاطر والتحسينات المطلوبة.

# Project Change Log

هذا الملف مخصص لتوثيق أي تعديل يتم على المشروع.

الهدف من الملف:

- توثيق التعديلات بشكل واضح
- مساعدة صاحب المشروع على مراجعة ما تم
- معرفة ما الذي تغير في الكود أو الإعدادات أو الربط

قاعدة العمل:

- أي تعديل جديد على المشروع يجب تسجيله هنا قبل إنهاء العمل
- يكتب التعديل بتاريخ واضح
- يكون الشرح مختصر وسهل
- إذا كان التعديل محلي فقط وغير محفوظ داخل المشروع، يذكر ذلك بوضوح

---

## 2026-04-22

### 35. توحيد روابط API في مكونات club وteam

- تم إضافة `apiUrl` إلى ملفات config المركزية:
  - `client/club/lib/config.ts`
  - `client/team/lib/config.ts`
- تم تعديل GraphQL client في:
  - `client/club/lib/graphql.ts`
  - `client/team/lib/graphql.ts`
- تم استبدال الاستخدام المباشر لـ `process.env.NEXT_PUBLIC_API_URL` داخل
  مكونات `client/club` و`client/team` باستخدام `apiUrl`.
- شمل التعديل روابط:
  - الصور العامة عبر `/images`.
  - الملفات الخاصة عبر `/files`.
  - روابط المرفقات والجداول والنماذج.
- نتيجة البحث بعد التعديل:
  - لم يبق استخدام مباشر لـ `process.env.NEXT_PUBLIC_API_URL` داخل مكونات
    `club` أو `team`.
  - بقي الاستخدام فقط داخل ملفات config وcodegen.
- تم تشغيل:
  - `git diff --check`
- لم يتم تشغيل lint لهذين التطبيقين لأن `node_modules` غير موجودة محليا.

---

### 34. تنظيف logs في runtime الخادم وإضافة redaction للـ logger

- تم استبدال طباعات runtime داخل الخادم برسائل `logger` عامة في:
  - `server/src/app.mjs`
  - `server/src/Models/index.mjs`
  - `server/src/Socket/initSocketServer.mjs`
  - `server/src/Helpers/Mail.mjs`
  - عدة GraphQL resolvers كانت تطبع أخطاء خام.
- تم إزالة تعليقات debug القديمة التي تحتوي `console.log` من أجزاء runtime.
- تم تنظيف socket logs حتى لا تطبع معرفات sockets أو قائمة المستخدمين
  المتصلين.
- تم إضافة redaction داخل `server/src/Config/logger.mjs` لإخفاء قيم حساسة
  مثل:
  - authorization
  - token
  - refresh token
  - password
  - secret
  - api key
- نتيجة البحث بعد التنظيف:
  - لم يبق `console.log` في runtime.
  - بقيت مخرجات `console.log/console.error` داخل `server/scripts` فقط لأنها
    مخرجات أوامر CLI للمigrations/checks.
- تم ضبط `server/scripts/check-model-migrations.mjs` ليستثني ملف تجميع
  الموديلات `server/src/Models/index.mjs` من شرط migration، لأن تغييره لا
  يعني بالضرورة تعديل حقول قاعدة البيانات.
- تم تشغيل:
  - فحص syntax على ملفات الخادم المعدلة.
  - `npm test` داخل `server`
  - `npm run db:check-model-migrations` داخل `server`
  - `git diff --check`
- نتيجة اختبارات الخادم:
  - 8 اختبارات passed.

---

### 33. تنظيف logs في sports-course وlanding-page وprint

- تم إزالة طباعات debug من:
  - `client/sports-course`
  - `client/landing-page`
  - `client/print`
- تم تحويل طباعة أخطاء GraphQL في `client/print` إلى `console.warn` مقيّد
  بخارج الإنتاج، مثل باقي الواجهات.
- تم إزالة تعليقات debug التي تحتوي `console.log` من `sports-course` و`print`.
- تم تحسين auth helper في `client/sports-course` عبر تثبيت callbacks وتنظيف
  interval الخاص بتجديد الجلسة عند مغادرة الصفحة.
- نتيجة البحث بعد التنظيف:
  - لم يبق `console.log` فعلي داخل `sports-course`, `landing-page`, أو `print`.
  - بقيت `console.warn` الخاصة بأخطاء GraphQL خارج الإنتاج فقط.
- تم تشغيل اختبار `client/sports-course`:
  - `CI=true npm test -- --watchAll=false`
  - النتيجة: passed.
- ملاحظة: ما زال يظهر تحذير CRA عن dependency غير مصرح بها، وتحذير Jest عن
  open handles، لكن الاختبار لم يفشل.
- لم يتم تشغيل lint/test داخل `landing-page` و`print` لأن `node_modules` غير
  موجود محليا لهما.

---

### 32. تنظيف logs في واجهتي club وteam

- تم إزالة طباعات pagination والبحث من جداول واجهتي:
  - `client/club`
  - `client/team`
- تم إزالة طباعات الأخطاء والبيانات الخام من نماذج `Modal` و`Drawer` في
  `club` و`team`.
- تم تحويل callbacks الافتراضية في `ConfirmModal` إلى no-op بدلا من طباعة
  `Cancel` و`Confirmed`.
- تم إزالة تعليقات debug قديمة تحتوي `console.log`.
- تم تحسين auth helper في `client/club` و`client/team` عبر تثبيت callbacks
  وتنظيف interval الخاص بتجديد الجلسة عند مغادرة الصفحة.
- نتيجة البحث بعد التنظيف:
  - لم يبق `console.log` في `client/club` أو `client/team`.
  - بقي `console.warn` داخل GraphQL clients فقط، وهو يعمل خارج الإنتاج.
- تم تشغيل:
  - `git diff --check`
- لم يتم تشغيل lint داخل `client/club` و`client/team` لأن `node_modules` غير
  موجود محليا لهذين التطبيقين.

---

### 31. تنظيف logs في نماذج الإدارة وتطبيق اللاعب

- تم تنظيف نماذج `client/super-admin` الإدارية من طباعات runtime داخل
  callbacks وcatch blocks، مع إبقاء السلوك نفسه عند نجاح أو فشل العمليات.
- تم تنظيف نماذج `client/plyer` الخاصة بالطلبات والمقترحات والشكاوى من
  طباعات الأخطاء الخام.
- تم تنظيف جداول `client/plyer` الخاصة بالطلبات والمقترحات والشكاوى من
  طباعات البحث وتغيير الصفحات.
- تم إصلاح إعداد pagination في جداول `client/plyer` بعد إزالة دالة الطباعة
  القديمة حتى لا تبقى مراجع مكسورة.
- تم إزالة تعليقات قديمة تحتوي `console.log` داخل تطبيق اللاعب وواجهة
  `super-admin`.
- تم تحسين auth helper في `client/super-admin` و`client/plyer` عبر تثبيت
  callbacks وتنظيف interval عند مغادرة الصفحة.
- تم تشغيل:
  - `npm run lint -- --file ...` داخل `client/super-admin` على الملفات
    المتأثرة، والنتيجة بدون warnings أو errors
  - `git diff --check`
- لم يتم تشغيل lint داخل `client/plyer` لأن `node_modules` غير موجود محليا
  لهذا التطبيق.

---

### 30. إزالة طباعات validation errors من نماذج الدخول والإدارة

- تم إزالة callbacks التي تطبع `errors` عند فشل validation من صفحات الدخول:
  - `client/club/pages/login/*`
  - `client/team/pages/login/*`
  - `client/super-admin/pages/login/*`
  - `client/plyer/pages/login/*`
- تم إزالة نفس نمط الطباعة من عدد من نماذج الإدارة في:
  - `client/club/components/Modal`
  - `client/team/components/Modal`
  - `client/super-admin/components/Modal`
- تم تنظيف `errors` غير المستخدم من `useForm` في النماذج التي لم تعد تحتاجه.
- تم إصلاح تحذير `react-hooks/exhaustive-deps` في:
  - `client/super-admin/components/Modal/EditClubModal.tsx`
- تم تشغيل lint على ملفات `super-admin` المتأثرة، والنتيجة:
  - لا توجد warnings أو errors.

---

### 29. تنظيف logs خام داخل الخادم

- تم تنظيف طباعات خام داخل ملفات الخادم التالية:
  - `server/src/Helpers/Identical.mjs`
  - `server/src/Helpers/Mail.mjs`
  - `server/src/Graphql/Resolvers/Players.mjs`
  - `server/src/Graphql/Resolvers/Blog.mjs`
  - `server/src/Graphql/Resolvers/League.mjs`
  - `server/src/Graphql/Resolvers/Stadium.mjs`
  - `server/src/Graphql/Resolvers/Expense.mjs`
- تمت إزالة طباعات تعرض:
  - نتيجة فحص OCR.
  - أسماء ملفات مرفوعة.
  - نتائج استعلامات.
  - أخطاء خام من catch blocks.
- تم استبدال بعض الأخطاء برسائل `logger.error` عامة بدون تفاصيل حساسة.
- تم تشغيل فحص syntax على الملفات المعدلة.
- تم تشغيل `npm test` داخل `server` والنتيجة:
  - 8 اختبارات passed.

---

### 28. توحيد إعدادات API في sports-course وlanding-page

- تم إضافة config مركزي في:
  - `client/sports-course/src/lib/config.ts`
  - `client/landing-page/src/lib/config.ts`
- تم تعديل GraphQL client في `client/sports-course` لاستخدام `apiBaseUrl`
  المركزي بدلا من تعريف الرابط داخل ملف GraphQL نفسه.
- تم تعديل مكونات عرض المشاركين في `sports-course` لاستخدام نفس config عند
  بناء روابط الصور.
- تم تعديل GraphQL client وروابط الصور في `landing-page` لاستخدام `apiUrl`
  المركزي.
- تم إزالة import غير مستخدم من `fs` داخل:
  - `client/landing-page/src/component/Card/CardStadium.tsx`
- تم تشغيل اختبار `client/sports-course`:
  - `npm test -- --watchAll=false`
  - النتيجة: passed.

---

### 27. تنظيف دفعة إضافية من logs الحساسة

- تم إزالة طباعات تعرض بيانات runtime أو بيانات مستخدمين من:
  - صفحات الرسائل والاجتماعات في `client/club`.
  - صفحات الرسائل والاجتماعات والمصروفات في `client/team`.
  - مكونات البحث عن الأشخاص وعرض الرسائل في `client/club` و`client/team`.
  - صفحة الملف الشخصي في `client/plyer`.
  - صفحات `Assembly`, `Members`, و`Technicals` في تطبيق `client/print`.
  - ملف routes في `client/sports-course`.
- تم تعديل GraphQL client في `client/landing-page` حتى لا يطبع أخطاء GraphQL
  في الإنتاج.
- تم تشغيل اختبار `client/sports-course`:
  - `npm test -- --watchAll=false`
  - النتيجة: passed.
- ملاحظة: ظهر تحذير من `react-scripts` بخصوص dependency غير مصرح بها، وتحذير
  Jest عن open handles، لكن الاختبار لم يفشل.

---

### 26. نقل روابط الطباعة في club وteam إلى env

- تم إضافة config للروابط في:
  - `client/club/lib/config.ts`
  - `client/team/lib/config.ts`
- تم إضافة متغير بيئة جديد في:
  - `client/club/.env.example`
  - `client/team/.env.example`
- المتغير الجديد:
  - `NEXT_PUBLIC_PRINT_URL`
- تم تعديل روابط الطباعة في واجهتي `club` و`team` لتستخدم config بدلا من
  كتابة `https://print.omkooora.com` داخل المكونات والصفحات.
- شملت الروابط:
  - طباعة بطاقات اللاعبين.
  - طباعة بطاقات الجمعية.
  - طباعة قوائم اللاعبين.
  - طباعة قوائم الأعضاء والجهاز الفني.

---

### 25. إزالة روابط codegen الخارجية المباشرة

- تم تعديل ملفات `codegen.ts` في الواجهات التالية:
  - `client/club/codegen.ts`
  - `client/team/codegen.ts`
  - `client/super-admin/codegen.ts`
  - `client/plyer/codegen.ts`
- أصبحت ملفات codegen تستخدم:
  - `NEXT_PUBLIC_API_URL`
  - fallback محلي: `http://localhost:7001`
- تم تعديل ملفات `graphql.config.yml` في نفس الواجهات لتستخدم ملف schema
  المحلي:
  - `./graphql.schema.json`
- تم إزالة الاعتماد المباشر على:
  - `https://api-employees.qafilaty.com/graphql`
- الهدف هو تقليل الروابط الصلبة داخل المشروع وربط التوليد ببيئة التشغيل.

---

### 24. تقييد مسار الصور العام

- تم استبدال `express.static` المفتوح على مجلد `uploads` بمسار محدود:
  - `GET /images/:filename`
- تم إضافة middleware جديد:
  - `server/src/Middlewares/PublicImages.mjs`
- أصبح `/images` يسمح فقط بأسماء ملفات آمنة وامتدادات صور محددة:
  - `jpg`
  - `jpeg`
  - `png`
  - `webp`
- لم يعد `/images` يخدم مستندات مثل:
  - `pdf`
  - `docx`
  - `xlsx`
  - `zip`
  - `svg`
- تم إبقاء `/files/:filename` للمستندات الخاصة التي تحتاج مصادقة.
- تم إضافة اختبار جديد للتأكد من أن `/images` يقبل الصور الآمنة ويرفض
  المستندات والـ SVG ومحاولات path traversal.
- تم تشغيل `npm test` داخل `server` والنتيجة:
  - 8 اختبارات passed
- تم تشغيل:
  - `node --check server/src/Middlewares/PublicImages.mjs`
  - `node --check server/src/app.mjs`

---

### 23. إضافة أمثلة إعدادات البيئة للواجهات

- تم إضافة `.env.example` للواجهات التالية:
  - `client/club/.env.example`
  - `client/team/.env.example`
  - `client/super-admin/.env.example`
  - `client/plyer/.env.example`
  - `client/landing-page/.env.example`
  - `client/sports-course/.env.example`
  - `client/print/.env.example`
- تم توثيق رابط API المحلي الافتراضي:
  - `http://localhost:7001`
- تم تعديل تطبيق `client/print` ليقرأ روابط التشغيل من env:
  - `REACT_APP_API_URL`
  - `REACT_APP_PRINT_URL`
- تم إضافة ملف إعداد مركزي:
  - `client/print/src/config.ts`
- تم إزالة روابط API الصلبة داخل ملفات PDF الأساسية في تطبيق الطباعة، مع
  إبقاء fallback إنتاجي داخل ملف config المركزي.
- تم جعل طباعة أخطاء GraphQL في تطبيق `print` تعمل خارج الإنتاج فقط.
- لم يتم تشغيل test/lint لتطبيق `print` لأن `node_modules` غير موجود محليا.

---

### 22. نقل أول دفعة من روابط الملفات الخاصة إلى المسار المحمي

- تم تعديل روابط المستندات الخاصة في واجهتي `club` و`team` لتستخدم:
  - `/files/:filename`
- شملت الدفعة الأولى:
  - صور البطاقة المدنية الأمامية والخلفية في شاشة التحقق.
  - روابط البطاقة المدنية في جداول اللاعبين والأعضاء.
  - استمارة موافقة ولي الأمر.
  - شهادة الخبرة للجهاز الفني.
  - مرفقات اللاعبين والرسائل والاجتماعات.
  - ملف الاستمارة في بطاقات النماذج.
- تم تصحيح رابط مرفق المصروفات في واجهة `team`:
  - كان يتحقق من `attachment` لكن يفتح `nationalID`.
  - أصبح يفتح `attachment` عبر `/files`.
- بقيت صور الأخبار، الملاعب، والصور الشخصية العامة على `/images` مؤقتا حتى
  لا تتأثر الصفحات العامة.
- تم تشغيل:
  - `npm test` داخل `server`
  - `npm run db:check-model-migrations` داخل `server`
  - `node --check server/src/app.mjs`
  - `node --check server/src/Middlewares/PrivateFiles.mjs`
- لم يتم تشغيل lint لواجهتي `club` و`team` لأن `node_modules` غير موجودة
  محليا لهذين التطبيقين.

---

### 21. إضافة مسار محمي للملفات الخاصة

- تم إضافة middleware جديد:
  - `server/src/Middlewares/PrivateFiles.mjs`
- تم إضافة مسار محمي في الخادم:
  - `GET /files/:filename`
- المسار الجديد يعمل بعد `AuthMiddleware`، لذلك يتطلب مستخدما مصادقا.
- يدعم المسار المصادقة عبر:
  - `Authorization` header
  - refresh cookie `__tomoh` مع التحقق من `user-agent`,
    `refresh_token_id`, و`refresh_token_version`
- دعم refresh cookie ضروري لأن روابط الملفات المباشرة في المتصفح لا ترسل
  `Authorization` header.
- تمت إضافة حماية على اسم الملف:
  - منع المسارات الفرعية
  - منع path traversal مثل `../`
  - السماح فقط بأسماء ملفات آمنة
- تمت إضافة headers للملفات الخاصة:
  - `Cache-Control: private, no-store`
  - `X-Content-Type-Options: nosniff`
- لم يتم إيقاف `/images` حاليا لأن الواجهات ما زالت تستخدمه لصور ومرفقات
  ومستندات. إيقافه مباشرة سيكسر روابط تحميل قائمة.
- تم إضافة اختبارات:
  - `server/tests/private-files.test.mjs`
- تم تشغيل `npm test` داخل `server` والنتيجة:
  - 7 اختبارات passed
- تم تشغيل فحص syntax على الملفات الجديدة والمعدلة، وتم تشغيل `git diff --check`.

---

### 20. إضافة اختبارات آلية لرفع الصور

- تم إضافة سكربت اختبار للخادم:
  - `npm test`
- السكربت يستخدم Node.js test runner بدون إضافة dependency جديدة:
  - `node --test "tests/**/*.test.mjs"`
- تم إضافة اختبار جديد:
  - `server/tests/upload.test.mjs`
- الاختبارات تغطي helper رفع الصور:
  - قبول ملف PNG صحيح وحفظه
  - حذف الملف المؤقت بعد الاختبار
  - رفض امتداد غير مسموح مثل SVG
  - رفض MIME type غير مطابق
  - رفض محتوى ملف لا يطابق magic bytes
- تم تشغيل `npm test` داخل `server` والنتيجة:
  - 4 اختبارات passed
- تم تشغيل:
  - `node --check server/tests/upload.test.mjs`
  - `node --check server/src/Helpers/Upload.mjs`
  - `git diff --check`
- لا تزال اختبارات upload الخاصة بكل resolver بحاجة إضافة تدريجية عند نقل باقي
  مرفقات المشروع إلى helper المركزي.

---

### 19. إزالة طباعات حساسة من تسجيل الدخول وتجديد token

- تم إزالة طباعة refresh token من عملاء GraphQL:
  - `client/club/lib/graphql.ts`
  - `client/team/lib/graphql.ts`
  - `client/super-admin/lib/graphql.ts`
  - `client/plyer/lib/graphql.ts`
  - `client/sports-course/src/lib/graphql.ts`
- تم جعل رسائل أخطاء GraphQL في العملاء تظهر في التطوير فقط بدلا من الإنتاج.
- تم إزالة طباعة نتيجة `authenticateUser` من صفحات الدخول:
  - `client/club/pages/login/index.tsx`
  - `client/plyer/pages/login/index.tsx`
- تم إزالة طباعات debug من تسجيل الدخول في الخادم داخل:
  - `server/src/Graphql/Resolvers/User.mjs`
- تم إزالة logging خاص باستعلام `forgetPassword` حتى لا تطبع SQL query في
  runtime.
- تم تشغيل:
  - `node --check server/src/Graphql/Resolvers/User.mjs`
  - `git diff --check`
  - lint صفحة دخول `client/super-admin`
  - اختبار `client/sports-course`
- هذا لا يغلق بند logs بالكامل لأن المشروع ما زال يحتوي console logs عامة في
  شاشات ومكونات أخرى تحتاج تنظيف تدريجي.

---

### 18. إضافة check يمنع تعديل Models بدون migration

- تم إضافة سكربت تحقق جديد:
  - `server/scripts/check-model-migrations.mjs`
- تم إضافة أمر npm داخل `server/package.json`:
  - `npm run db:check-model-migrations`
- وظيفة السكربت:
  - يفحص الملفات المتغيرة في `server/src/Models`
  - يفحص وجود ملفات migration متغيرة في `server/migrations`
  - يفشل إذا تغير model بدون migration مرافق
- تم إضافة GitHub Action جديد:
  - `.github/workflows/server-checks.yml`
- الـ workflow يعمل على pull requests التي تغير ملفات `server/**`، ويشغل:
  - `npm ci`
  - `npm run db:check-model-migrations`
  - `node --check` على ملفات `.mjs` المتغيرة في الخادم
- تم تشغيل السكربت محليا ونجح على الحالة الحالية.
- تم تشغيل فحص syntax على السكربت، وتم تشغيل `git diff --check`.

---

### 17. إضافة حدود GraphQL للعمق والتعقيد

- تم إضافة ملف validation rules جديد:
  - `server/src/Graphql/ValidationRules.mjs`
- تم ربط validation rules داخل Apollo Server في:
  - `server/src/app.mjs`
- الحدود المضافة:
  - حد أقصى لعمق الاستعلام عبر `GRAPHQL_MAX_DEPTH`
  - حد أقصى لتعقيد الاستعلام عبر `GRAPHQL_MAX_COMPLEXITY`
- القيم الافتراضية الموثقة:
  - `GRAPHQL_MAX_DEPTH=8`
  - `GRAPHQL_MAX_COMPLEXITY=500`
- تم توثيق المتغيرات الجديدة في:
  - `server/.env.example`
- عند تجاوز الحد يرجع GraphQL خطأ بكود:
  - `GRAPHQL_DEPTH_LIMIT`
  - `GRAPHQL_COMPLEXITY_LIMIT`
- تم تجاهل حقول introspection الداخلية مثل `__schema`, `__type`, و`__typename`
  من الحساب حتى لا يتعطل التطوير المحلي.
- تم تشغيل فحص syntax على ملفات التعديل، وتم تشغيل اختبار validation صغير
  للتأكد من رفض الاستعلامات العميقة والمعقدة، وتم تشغيل `git diff --check`.

---

### 16. تشغيل migrations والفحوص الآلية

- تم تشغيل migrations محليا عبر:
  - `npm run db:migrate`
- تم تطبيق migrations التالية بنجاح:
  - `202604220001-baseline-current-schema.mjs`
  - `202604220002-add-user-login-lock-fields.mjs`
  - `202604220003-add-user-refresh-session-fields.mjs`
- تم تشغيل:
  - `npm run db:status`
- حالة migrations بعد التشغيل:
  - كل migrations الحالية أصبحت `up`.
- تم التحقق من وجود الأعمدة الجديدة في جدول `users`:
  - `failed_login_attempts`
  - `locked_until`
  - `last_failed_login_at`
  - `refresh_token_version`
  - `refresh_token_id`
- تم تحديث اختبار `client/sports-course/src/App.test.tsx` لأنه كان test افتراضي
  قديم يبحث عن `learn react` ولا يلف التطبيق بـ Router.
- تم تشغيل اختبار `client/sports-course`:
  - `CI=true npm test -- --watchAll=false`
  - النتيجة: passed.
- تم تشغيل lint على صفحة دخول `client/super-admin`:
  - `npm run lint -- --file pages/login/index.tsx`
  - النتيجة: passed.
- لم يتم تشغيل lint/test على تطبيقات `client/club`, `client/team`,
  `client/plyer`, `client/print`, و`client/landing-page` لأن `node_modules`
  غير موجودة محليا لهذه التطبيقات.
- تم تشغيل فحص syntax على ملفات الخادم المعدلة والجديدة، وتم تشغيل
  `git diff --check`.

---

### 15. معالجة أولية لنتائج npm audit في الخادم

- تم تشغيل:
  - `npm audit --omit=dev --json`
- قبل الإصلاح كانت نتيجة production audit:
  - 32 ثغرة
  - 4 critical
  - 15 high
  - 9 moderate
  - 4 low
- تم تشغيل:
  - `npm audit fix --omit=dev`
- تم ترقية حزم مباشرة حساسة في `server/package.json` و`server/package-lock.json`:
  - `mysql2`
  - `jsonwebtoken`
  - `nodemailer`
  - `apollo-server-core`
  - `apollo-server-express`
  - `axios`
  - `cookie-parser`
  - `cors`
  - `express`
  - `graphql`
  - `sequelize`
  - `socket.io`
  - `uuid`
- بعد الإصلاح أصبحت نتيجة `npm audit --omit=dev`:
  - 6 ثغرات
  - كلها moderate
  - لا توجد high
  - لا توجد critical
- المتبقي:
  - Apollo Server v3 لديه advisory بدون fix داخل v3، والحل الحقيقي لاحقا هو
    ترحيل Apollo إلى `@apollo/server`.
  - Ajv يأتي عبر Umzug/Rushstack، ويحتاج متابعة عند توفر تحديث آمن من السلسلة
    نفسها أو قرار واضح باستخدام override.
- تم تشغيل فحص syntax على ملفات الخادم المرتبطة بالتحديثات.

---

### 14. تقوية أولية لرفع الصور

- تم إضافة helper مركزي جديد:
  - `server/src/Helpers/Upload.mjs`
- helper الصور يتحقق من:
  - امتداد الملف
  - MIME type
  - magic bytes لمحتوى الملف
- أنواع الصور المسموحة حاليا:
  - `JPEG`
  - `JPG`
  - `PNG`
- تم استخدام `pipeline` بدلا من `stream.pipe` المباشر حتى يتم انتظار انتهاء
  الكتابة والتقاط أخطاء stream بشكل صحيح.
- تم تطبيق helper الصور على:
  - شعار النادي في `server/src/Graphql/Resolvers/Club.mjs`
  - شعار الفريق في `server/src/Graphql/Resolvers/Team.mjs`
  - صورة الشخص في `server/src/Graphql/Resolvers/User.mjs`
- هذا التعديل لا يغطي كل uploads في المشروع بعد. ما زالت مرفقات الهوية،
  المستندات، وصور/مرفقات باقي resolvers بحاجة نقل تدريجي إلى helper مناسب.
- تم تشغيل فحص syntax على helper وresolvers المتأثرة، وتم تشغيل
  `git diff --check`.

---

### 13. تحسين session وrefresh token

- تم تعديل نموذج المستخدم:
  - `server/src/Models/User.mjs`
- تم إضافة migration جديد:
  - `server/migrations/202604220003-add-user-refresh-session-fields.mjs`
- الأعمدة الجديدة في جدول المستخدمين:
  - `refresh_token_version`
  - `refresh_token_id`
- تم تعديل helper إنشاء refresh token:
  - `server/src/Helpers/JWT.mjs`
- أصبح refresh token يحتوي معرف جلسة وإصدار جلسة، وليس مجرد JWT مع user-agent.
- تم تعديل resolver `refreshToken` بحيث:
  - يتحقق من user-agent كما كان سابقا
  - يتحقق من أن معرف وإصدار الجلسة مطابقان للحالة المحفوظة في قاعدة البيانات
  - يدور refresh token عند كل استخدام ناجح
  - يرسل cookie جديدا بعد التدوير
- تم تعديل `authenticateUser` ليبدأ جلسة refresh جديدة عند تسجيل الدخول.
- تم تعديل `logOut` ليبطل جلسة refresh الحالية قبل حذف cookie.
- بعد تطبيق هذا التغيير، refresh tokens القديمة التي لا تحتوي معرف وإصدار جلسة
  ستحتاج تسجيل دخول جديد.
- هذا التعديل يحتاج تشغيل migrations قبل استخدام نسخة الكود الجديدة على قاعدة
  بيانات قائمة.
- تم تشغيل فحص syntax على ملفات التعديل، وتم تشغيل `git diff --check`.

---

### 12. تقليل رسائل أخطاء تسجيل الدخول الكاشفة لحالة الحساب

- تم تعديل `authenticateUser` داخل:
  - `server/src/Graphql/Resolvers/User.mjs`
- حالات تسجيل الدخول التالية أصبحت ترجع كودا عاما:
  - بريد غير موجود
  - كلمة مرور خاطئة
  - بريد غير مفعل
  - حساب غير مفعل
- الكود العام الجديد:
  - `AUTHENTICATION_FAILED`
- تم إبقاء كود القفل المؤقت:
  - `ACCOUNT_LOCKED`
- تم تحديث صفحات الدخول للتعامل مع الكود العام ورسالة القفل المؤقت:
  - `client/club/pages/login/index.tsx`
  - `client/team/pages/login/index.tsx`
  - `client/super-admin/pages/login/index.tsx`
  - `client/plyer/pages/login/index.tsx`
  - `client/sports-course/src/pages/Login.tsx`
- الهدف من التعديل هو تقليل كشف ما إذا كان البريد موجودا، أو الحساب غير مفعل،
  أو كلمة المرور فقط هي الخاطئة.
- تم تشغيل فحص syntax على resolver المستخدم، وتم تشغيل `git diff --check`.

---

### 11. إضافة account lock مؤقت لمحاولات تسجيل الدخول الفاشلة

- تم تعديل نموذج المستخدم:
  - `server/src/Models/User.mjs`
- تم إضافة migration جديد:
  - `server/migrations/202604220002-add-user-login-lock-fields.mjs`
- الأعمدة الجديدة في جدول المستخدمين:
  - `failed_login_attempts`
  - `locked_until`
  - `last_failed_login_at`
- تم تعديل `authenticateUser` داخل:
  - `server/src/Graphql/Resolvers/User.mjs`
- عند تكرار كلمة مرور خاطئة يتم رفع عداد المحاولات، وبعد الوصول للحد المحدد
  يتم قفل الحساب مؤقتا.
- عند تسجيل دخول ناجح يتم تصفير عداد المحاولات وإلغاء بيانات القفل السابقة.
- تم إضافة إعدادات في `server/.env.example`:
  - `MAX_FAILED_LOGIN_ATTEMPTS`
  - `LOGIN_LOCK_MINUTES`
- هذا التعديل يحتاج تشغيل migrations قبل استخدام نسخة الكود الجديدة على قاعدة
  بيانات قائمة.
- تم تشغيل فحص syntax على ملفات التعديل، وتم تشغيل `git diff --check`.

---

### 10. إضافة rate limiting أولي لعمليات GraphQL الحساسة

- تم إضافة middleware جديد:
  - `server/src/Middlewares/GraphqlRateLimit.mjs`
- تم ربطه على مسار GraphQL داخل:
  - `server/src/app.mjs`
- العمليات الحساسة التي أصبحت عليها حدود طلبات أولية:
  - `authenticateUser`
  - `forgetPassword`
  - `resendVerificationEmail`
  - `changePassword`
  - `refreshToken`
- في حالة تجاوز الحد يرجع السيرفر HTTP `429` مع كود `RATE_LIMITED` وheader
  `Retry-After`.
- هذا التنفيذ يستخدم ذاكرة السيرفر الحالية، لذلك هو خطوة حماية أولية وليس بديلا
  نهائيا عن rate limiting مشترك عبر Redis أو خدمة خارجية عند تشغيل أكثر من نسخة.
- تم تنفيذ account lock في خطوة لاحقة ضمن نفس تاريخ العمل.
- تم تشغيل فحص syntax على ملفات rate limiting والتشغيل، وتم تشغيل
  `git diff --check`.

---

### 9. ضبط تشغيل الإنتاج وحماية إعدادات Apollo

- تم تعديل سكربتات الخادم في `server/package.json`:
  - `npm run dev` لتشغيل التطوير عبر `nodemon`
  - `npm start` لتشغيل الإنتاج عبر `server/scripts/start-production.mjs`
- تم إضافة سكربت:
  - `server/scripts/start-production.mjs`
- أصبح تشغيل الإنتاج ينفذ migrations عبر Umzug قبل بدء السيرفر.
- تم تعديل `server/ecosystem.config.cjs` ليستخدم سكربت الإنتاج الجديد.
- تم تعطيل `watch` في PM2 حتى لا يعيد تشغيل الخادم تلقائيا في الإنتاج بسبب
  تغييرات الملفات.
- تم تعديل `server/src/app.mjs` بحيث تكون الإعدادات التالية معطلة في الإنتاج:
  - `playground`
  - `introspection`
  - `debug`
- تم إضافة حد لحجم body عبر `REQUEST_BODY_LIMIT` مع قيمة افتراضية `1mb`.
- تم إضافة خيار `TRUST_PROXY` لاستخدام IP الحقيقي عند تشغيل الخادم خلف proxy
  موثوق.
- تم توثيق `REQUEST_BODY_LIMIT` و`TRUST_PROXY` داخل `server/.env.example`.
- تم تشغيل فحص syntax على ملفات التشغيل المعدلة، وتم تشغيل `git diff --check`.

---

### 8. إضافة أساس نظام migrations لقاعدة البيانات

- تم إضافة اعتماد `umzug` في `server/package.json`.
- تم إضافة سكربتات قاعدة البيانات:
  - `npm run db:migrate`
  - `npm run db:rollback`
  - `npm run db:status`
- تم إضافة ملف إعداد migrator:
  - `server/src/Database/migrator.mjs`
- تم إضافة سكربت تشغيل migrations:
  - `server/scripts/migrate.mjs`
- تم إنشاء مجلد migrations مع baseline للحالة الحالية:
  - `server/migrations/202604220001-baseline-current-schema.mjs`
- تم تعديل `server/src/Models/index.mjs` بحيث لا يعمل
  `DB.sync({ alter: true })` تلقائيا.
- تم توثيق متغير `DB_SYNC_ALTER` داخل:
  - `server/.env.example`
- أصبح تشغيل `DB.sync({ alter: true })` يحتاج:
  - `DB_SYNC_ALTER=true`
  - وأن لا تكون البيئة `production`
- لم يتم تشغيل migrations على قاعدة البيانات أثناء هذا التعديل.
- تم تشغيل فحص syntax على ملفات migrations والملف المعدل.

---

### 7. توسيع عزل الوصول على resolvers الإدارية

- تم توسيع استخدام helper الصلاحيات المركزي على ملفات GraphQL resolvers
  التالية:
  - `server/src/Graphql/Resolvers/Meeting.mjs`
  - `server/src/Graphql/Resolvers/Message.mjs`
  - `server/src/Graphql/Resolvers/Permission.mjs`
  - `server/src/Graphql/Resolvers/Request.mjs`
  - `server/src/Graphql/Resolvers/Transfer.mjs`
  - `server/src/Graphql/Resolvers/Blog.mjs`
  - `server/src/Graphql/Resolvers/Form.mjs`
  - `server/src/Graphql/Resolvers/Stadium.mjs`
  - `server/src/Graphql/Resolvers/Team.mjs`
  - `server/src/Graphql/Resolvers/Club.mjs`
  - `server/src/Graphql/Resolvers/League.mjs`
  - `server/src/Graphql/Resolvers/TechnicalApparatus.mjs`
  - `server/src/Graphql/Resolvers/ClubManagement.mjs`
- أصبحت عمليات القراءة أو التعديل التي تعتمد على `idClub`, `idTeam`,
  `id_club`, أو `id_team` تتحقق من نطاق المستخدم الحالي قبل تنفيذ الاستعلام.
- تم جعل عمليات إنشاء وتعديل وحذف النادي مقتصرة على المشرف العام.
- تم إضافة تحقق خاص للكيانات المركبة مثل الرسائل، الانتقالات، البطولات،
  الفرق المشاركة، المباريات، بطاقات المباريات، والهدافين.
- تم ترك flows العامة المرتبطة بالتسجيل والطباعة والحجز للفصل في خطوة مستقلة
  حتى لا يتم كسر وظائف عامة قائمة.
- تم تشغيل:
  - `node --check` على ملفات resolvers المعدلة
  - `git diff --check`

---

### 6. بداية عزل الوصول حسب النادي والفريق

- تم إضافة helper مركزي جديد:
  - `server/src/Helpers/Authorization.mjs`
- الهدف من helper:
  - التأكد من وجود جلسة مصادقة
  - السماح للمشرف العام بالوصول الكامل
  - تحديد أندية وفرق المستخدم الحالي من `ClubManagement` و`Members`
  - منع الوصول إلى نادي أو فريق خارج نطاق المستخدم الحالي
- تم تطبيق العزل مبدئيا على resolver المصروفات:
  - `server/src/Graphql/Resolvers/Expense.mjs`
- أصبحت عمليات قراءة، إنشاء، تعديل، وحذف المصروفات تتحقق من صلاحية الوصول
  إلى `id_club` أو `id_team` قبل تنفيذ العملية.
- تم الحفاظ على أخطاء Apollo الأصلية مثل `FORBIDDEN` حتى لا يتم تحويلها إلى
  أخطاء عامة.
- تم تشغيل فحص syntax على:
  - `server/src/Helpers/Authorization.mjs`
  - `server/src/Graphql/Resolvers/Expense.mjs`

---

### 5. تفعيل `@auth` على GraphQL endpoints إدارية حساسة

- تم تحويل عدد من `#@auth(requires: user)` المعطلة إلى
  `@auth(requires: user)` فعلي داخل ملفات schema.
- شملت الحماية ملفات إدارة داخلية مثل:
  - `server/src/Graphql/Schemas/Expense.mjs`
  - `server/src/Graphql/Schemas/Meeting.mjs`
  - `server/src/Graphql/Schemas/Message.mjs`
  - `server/src/Graphql/Schemas/Permission.mjs`
  - `server/src/Graphql/Schemas/Request.mjs`
  - `server/src/Graphql/Schemas/Transfer.mjs`
  - `server/src/Graphql/Schemas/Form.mjs`
  - `server/src/Graphql/Schemas/League.mjs`
- تم حماية عمليات إدارة النادي والفريق والأخبار والملعب مثل الإنشاء والتعديل
  والحذف.
- تم حماية query `person(cardNumber)` لأنها ترجع بيانات شخص بناء على رقم بطاقة.
- تم حماية عمليات الإدارة على اللاعبين والأعضاء مثل التعديل، الحذف، تغيير
  الحالة، المرفقات، والإدخال الجماعي.
- لم يتم إغلاق endpoints العامة التي تعتمد عليها صفحات التسجيل والحجز العامة
  أو تطبيق الطباعة، لأنها تحتاج flow بديل قبل إغلاقها.
- تم تشغيل فحص syntax على ملفات schema المعدلة.

---

### 4. إغلاق عمليات إدارة المستخدم المفتوحة

- تم تعديل ملفات GraphQL الخاصة بالمستخدمين:
  - `server/src/Graphql/Schemas/User.mjs`
  - `server/src/Graphql/Resolvers/User.mjs`
- تم جعل mutation `createUser` تتطلب جلسة مصادقة عبر `@auth`.
- تم جعل mutation `activeUser` تتطلب جلسة مصادقة عبر `@auth`.
- تم إضافة فحص إداري داخل resolver قبل السماح بإنشاء أو تفعيل المستخدمين.
- لم يعد `createUser` يعتمد على قيم `role`, `activation`, أو `email_verify`
  القادمة من العميل عند إنشاء الحساب.
- أصبح دور المستخدم الجديد يحدد من جهة الخادم بناء على دور المستخدم المنفذ.
- أصبح الحساب الجديد ينشأ مع `email_verify: false` ويتم إرسال بريد تحقق إذا
  كانت إعدادات البريد متوفرة.
- تم تشغيل فحص syntax على الملفات المعدلة:
  - `node --check server/src/Graphql/Resolvers/User.mjs`
  - `node --check server/src/Graphql/Schemas/User.mjs`

---

### 1. تنظيم خطة العمل الداخلية

- تم تحويل ملف خطة المخاطر والتحسينات إلى checklist قابلة للمتابعة.
- أصبح كل بند يستخدم:
  - `[ ]` للنقطة غير المنجزة
  - `[x]` للنقطة التي تم تنفيذها والتحقق منها
- تم توضيح قاعدة العمل داخل ملف الخطة:
  - لا يتم تعليم أي بند كمنجز إلا بعد تطبيق التعديل
  - التحقق من التعديل
  - توثيق التغيير في هذا الملف

### 2. فصل الخطة الداخلية عن سجل التغييرات العام

- تم اعتماد `CHANGELOG.md` كسجل عام لتوثيق أي تعديل يتم على المشروع.
- تم توضيح أن ملف الخطة الداخلي مخصص لصاحب المشروع فقط ولا يستخدم كسجل عام
  للفريق.

### 3. منع رفع ملف الخطة الداخلي إلى GitHub

- تم تعديل ملف:
  - `.gitignore`
- الهدف:
  - تجاهل ملف `SECURITY_REVIEW_REPORT.md`
  - منع رفع خطة العمل الداخلية إلى GitHub في التحديثات القادمة

ملاحظة:

- إذا كان ملف الخطة الداخلي موجودا مسبقا داخل Git، يجب إزالته من التتبع مع
  الإبقاء عليه محليا حتى لا يظهر في GitHub بعد التحديث القادم.

---

## 2026-04-19

### 1. مراجعة هيكل المشاريع

- تم فحص المجلد الجذر وتحديد أن المشروع يحتوي على جزأين رئيسيين:
  - `tomoh`
  - `sports-course`
- تم تحديد أن `tomoh` عبارة عن منظومة فيها عدة تطبيقات مترابطة مع باك اند
- تم تحديد أن `sports-course` مشروع مستقل من ناحية التشغيل

### 2. تجهيز وتشغيل مشروع Tomoh محلياً

- تم تجهيز قاعدة بيانات محلية باسم `tomoh`
- تم تشغيل باك اند `tomoh/server`
- تم تشغيل واجهة `tomoh/client/super-admin`
- تم ضبط التشغيل محلياً على:
  - API: `http://localhost:7001/graphql`
  - Super Admin: `http://localhost:3001`

### 3. إنشاء حساب دخول محلي للتجربة

- تم إنشاء حساب Admin محلي داخل قاعدة البيانات للتجربة والاختبار
- بيانات الدخول التي تم استخدامها محلياً:
  - Email: `admin@tomoh.local`
  - Password: `Admin@12345`

ملاحظة:

- هذا الحساب تم إنشاؤه محلياً داخل قاعدة البيانات
- هذا الحساب ليس ملفاً داخل المشروع نفسه

### 4. تعديل الجلسات المحلية في Tomoh

- تم تعديل ملف:
  - `tomoh/server/src/Graphql/Resolvers/User.mjs`
- الهدف من التعديل:
  - تحسين عمل الكوكيز محلياً على `localhost`
  - تصحيح اسم كوكي تسجيل الخروج
  - جعل الإعداد `secure` خاصاً بالإنتاج فقط

### 5. تنظيف معلومات حساسة قبل رفع المشروع

- تم إنشاء ملف:
  - `tomoh/server/.env.example`
- الهدف:
  - توفير مثال لإعدادات البيئة بدون رفع البيانات الحساسة الحقيقية

- تم تعديل الملفات التالية لإزالة/استبدال المفاتيح والبيانات الحساسة:
  - `tomoh/server/src/Config/WinstonNodemailer.mjs`
  - `tomoh/server/src/Helpers/Mail.mjs`

- تم تحويل إعدادات البريد والمفاتيح إلى متغيرات بيئة بدل كتابتها بشكل مباشر داخل الكود

### 6. إنشاء Git موحد من جذر المشروع

- تم إنشاء مستودع Git جديد من جذر المشروع
- تم فصل مستودعات Git القديمة الداخلية من:
  - `sports-course`
  - `tomoh/server`
- تم حفظها كنسخة احتياطية خارج المشروع في:
  - `projectmosta_git_backups/`

الهدف:

- رفع المشروع كاملاً من الجذر كمستودع واحد
- منع رفع المشاريع الداخلية كـ submodules

### 7. إضافة ملف تجاهل موحد

- تم إنشاء ملف:
  - `.gitignore`

الهدف:

- منع رفع الملفات غير الضرورية مثل:
  - `node_modules`
  - ملفات البناء
  - ملفات البيئة المحلية
  - السجلات المحلية

### 8. رفع المشروع إلى GitHub

- تم ربط المشروع من الجذر مع الريبو:
  - `https://github.com/Almukhtar1984/oman-kooora.git`
- تم تنفيذ أول commit من الجذر
- تم رفع المشروع بنجاح إلى الفرع:
  - `main`

### 9. ملاحظات مهمة

- لم يتم حذف التعديلات السابقة التي أُنجزت اليوم
- لم يتم رفع ملفات `.env` المحلية
- لم يتم رفع `node_modules`
- تم الإبقاء على المشروع مرفوعاً بطريقة أنظف وأسهل للمراجعة

---

## طريقة إضافة أي تعديل جديد لاحقاً

عند أي تعديل جديد يضاف سطر أو قسم جديد بهذا الشكل:

### YYYY-MM-DD

- ما الذي تم تعديله
- ما الهدف من التعديل
- هل التعديل داخل الكود أو محلي فقط
- أسماء الملفات التي تم تعديلها إذا لزم

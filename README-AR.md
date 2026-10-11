# HIGHFIELD SCHOLARS 2027 — حزمة البداية

هذه ملفات بداية وليست جاهزة للاستخدام الحقيقي قبل نشر القواعد واختبارها.

## الإضافة
أضف الملفات إلى المستودع `ramyashref/highfield-portal` بنفس المسارات، دون استبدال ملفات الموقع الحالية:
- `trainee-login.html`
- `trainee-dashboard.html`
- `admin-dashboard.html`
- `js/firebase-config.js`
- `js/portal.js`
- `css/portal.css`
- `firestore.rules`
- `storage.rules`

ثم في Firebase:
1. Authentication → Settings → Authorized domains: تأكد من `highfieldeg.com` و`www.highfieldeg.com`.
2. Firestore Database → Rules: انشر محتوى `firestore.rules`.
3. فعّل Firebase Storage إن لم يكن مفعّلًا، ثم انشر `storage.rules`.
4. تأكد أن `info@highfieldeg.com` بريد موثّق في Authentication.
5. اختبر بحساب متدرب تجريبي وحساب الإدارة قبل بيانات حقيقية.

## حدود النسخة
- لا تستورد تسجيلات Google Sheets القديمة تلقائيًا.
- لا تملأ البرامج الـ33 تلقائيًا بعد؛ يلزم إضافة بياناتها وحالاتها.
- لوحة الإدارة الأولية تستخدم بريد الإدارة الموثق كشرط؛ الأفضل لاحقًا استخدام Custom Claims من بيئة خادمية موثوقة.
- رفع إثباتات الدفع يحتاج Firebase Storage، وقد يطلب إعداد فوترة حسب سياسات Firebase.
- لا تستخدمها لإدارة أموال حقيقية قبل اختبار قواعد الأمان وسلوك الاعتماد بدقة.
- لا تعدّل `Code.gs` أو روابط Apps Script أو نموذج التسجيل الحالي.

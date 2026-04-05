# منصة USDT | USDT Platform

منصة احترافية لشراء USDT بالتحويل البنكي.

## التشغيل السريع

```bash
cd usdt-platform
npm install
npm run dev
```

ثم افتح: http://localhost:3000

## بيانات الدخول

| الحساب | البريد | كلمة المرور |
|--------|--------|------------|
| المدير (Admin) | admin@usdt.sa | Admin@1234 |

## الصفحات

| الصفحة | الرابط |
|--------|--------|
| الرئيسية | / |
| تسجيل الدخول | /login |
| إنشاء حساب | /register |
| لوحة العميل | /dashboard |
| طلب جديد | /dashboard/new-order |
| لوحة المدير | /admin |

## تغيير الإعدادات

بعد التشغيل، يتم إنشاء ملف `data.db` تلقائياً.
يمكنك تعديل إعدادات المنصة (السعر، الحساب البنكي) مباشرة من قاعدة البيانات:
```sql
UPDATE settings SET value='3.80' WHERE key='usdt_rate';
```

## المتطلبات

- Node.js 18+
- npm

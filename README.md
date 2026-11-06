# Restaurant Booking Application

تطبيق مطعم كامل مع نظام حجز الطاولات وإدارة القائمة.

## المميزات

### الواجهة الأمامية (Frontend)
- الصفحة الرئيسية
- صفحة من نحن
- قائمة الطعام
- حجز طاولة
- تسجيل الدخول والتسجيل
- صفحة الملف الشخصي
- لوحة الإدارة

### الخلفية (Backend)
- نظام تسجيل دخول مع نوعين من المستخدمين (عادي/مدير)
- إدارة قائمة الطعام (إضافة/حذف/تعديل)
- نظام حجز الطاولات مع إشعارات
- إدارة المستخدمين والحجوزات
- ملف شخصي قابل للتعديل

## التثبيت والتشغيل

### المتطلبات
- Node.js (v14 أو أحدث)
- MongoDB

### خطوات التثبيت

1. استنساخ المشروع:
```bash
git clone <repository-url>
cd restaurant-booking-app
```

2. تثبيت التبعيات:
```bash
npm run install-all
```

3. إنشاء ملف .env في المجلد الرئيسي:
```env
MONGODB_URI=mongodb://localhost:27017/restaurant-app
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
```

4. تشغيل المشروع:
```bash
npm run dev
```

سيتم تشغيل:
- الخادم على: http://localhost:5000
- الواجهة الأمامية على: http://localhost:3000

## هيكل المشروع

```
restaurant-booking-app/
├── client/                 # React Frontend
├── server/                 # Node.js Backend
├── package.json
└── README.md
```

## التقنيات المستخدمة

### Frontend
- React.js
- React Router
- Axios
- CSS3

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Nodemailer

## الملفات الشخصية

### المستخدم العادي
- يمكنه حجز طاولة
- عرض حجوزاته
- تعديل ملفه الشخصي

### المدير
- إدارة المستخدمين
- إدارة الحجوزات (قبول/رفض)
- إدارة قائمة الطعام 
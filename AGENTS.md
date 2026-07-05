# جلسة العمل

## الهدف
إصلاح 38 خطأً مالياً وجعل النظام متجاوباً للجوال مع إمكانية الدخول من الهاتف عبر WiFi

## المنجز
### أساسيات الجوال
- `MainLayout.tsx`: القوائم الجانبية `hidden md:flex` + `pb-16` للمحتوى
- `MobileNav.tsx` جديد: شريط سفلي (5 أقسام رئيسية) يظهر فقط تحت `md`
- `RightSidebar.tsx`: زر هامبورجر عائم + قائمة متراكبة (overlay) للجوال
- `Topbar.tsx`: تصغير الأحجام والـ paddings تحت `md`
- `Dashboard.tsx`: أيقونات 10×10→20×20، padding 3→8، نص 11px
- `HotelPage.tsx`: بطاقات `grid-cols-2` بدلاً من 3-4، `p-3 md:p-6`، `text-[11px] md:text-sm`
- 9 ملفات جداول (`RoomTypes, DefineRoom, CancelReservation, EditReservation, ExtendStay, ExpensesPage, PaymentPage, RoomPrices, ServiceRequestPage`): `overflow-x-auto` بدلاً من `overflow-hidden` لإتاحة التمرير الأفقي
- `index.css`: `-webkit-tap-highlight-color: transparent` + `font-size: 16px` للحقول لمنع zoom التلقائي على iOS

### دخول من الهاتف
- `crypto.ts`: استبدال `crypto.subtle.digest` بهاش SHA-256 يدوي (يعمل على HTTP بدون SSL)

### أخطاء مالية (33 من 38)
- **16 خطأً سابقاً:** Double Collection, Debit/Credit معكوس, إقفال الصندوق, Math.min, زر تأكيد السعر, مصروفات بدون صندوق, إلغاء حجز بدون رد أموال, حذف دفعة/مصروف, تقارير async/sync, الميزانية + صافي الأرباح, CSV, نقلات بين الصناديق, حالة refunded
- **المشتريات (17 خطأً):**
  - `index.ts`: `export type` → `export` للثوابت
  - `PurchaseReturn.tsx`: إضافة قيد محاسبي عكسي (دائن: مشتريات / مدين: مورد) + `recordExternalReceipt` (استلام نقدية)
  - `AccountSettlement.tsx`: تحديث الفواتير المعلقة → `"paid"` + توزيع مبلغ التسوية
  - `SupplierStatement.tsx`: تضمين مرتجعات الشراء (`purchaseReturnService`) + إصلاح مفتاح `key`
  - `NewPurchaseInvoice.tsx`: إنشاء قيد محاسبي (مدين: مشتريات / دائن: مورد) عند تسجيل الفاتورة
  - `SuppliersPage.tsx`: إنشاء حساب مورد في `accountService` تلقائياً (`ensureAccount`)
  - `PaymentForm.tsx`: عكس حركة الصندوق عند حذف دفعة عبر `recordExternalReceipt`
  - `integration.ts`: تصدير `ensureAccount` لاستخدامه من المشتريات

## كيفية النقل والتشغيل على كمبيوتر آخر

### الملفات المطلوبة (كل شيء)
انسخ مجلد `jarash` بالكامل إلى الكمبيوتر الجديد. أهم الملفات:
- `run.bat` — **المُشغّل الرئيسي** (اضغط عليه双击 مباشرةً)
- `serve.cjs` — سيرفر الإنتاج (يُستخدم تلقائياً)
- `start.ps1` — سكريبت PowerShell (يكشف IP + QR code)
- `src/Jarash.Web/` — الكود المصدري + الاعتماديات

### طريقة التشغيل على الكمبيوتر الجديد
1. **تثبيت Node.js** من https://nodejs.org (اختر LTS)
2. **شغّل `run.bat`**:
   - إذا كانت `node_modules` غير موجودة → سيثبتها تلقائياً (يحتاج إنترنت)
   - يظهر قائمة اختيار: وضع التطوير (Vite) أو الإنتاج (Build + Serve)
   - يكشف IP المحلي ويعرض روابط الجوال تلقائياً
3. **من الجوال**: افتح الرابط http://192.168.x.x:5173 الذي يظهر في الشاشة

### توفير الوقت — أنشئ اختصاراً (Shortcut) على سطح المكتب
1. اضغط كليك يمين على `run.bat` → **Send to → Desktop (create shortcut)**
2. (اختياري) غيّر الأيقونة:
   - كليك يمين على الاختصار → Properties → Change Icon
   - اختر أي أيقونة من `C:\Windows\System32\imageres.dll` أو `shell32.dll`

### أوامر التشغيل
```powershell
# الطريقة الأسهل — فقط اضغط双击 على run.bat
.\run.bat

# أو عبر PowerShell مع كشف IP + QR code
.\start.ps1

# أو بدون QR
.\start.ps1 -NoQR
```

## الملفات الرئيسية

## ربط جهاز بصمة ZKTeco

### المتطلبات
- جهاز ZKTeco مربوط بالكمبيوتر عبر كيبل LAN (راوتر أو اتصال مباشر)
- الكمبيوتر والجهاز على نفس الشبكة المحلية (نفس نطاق IP، مثلاً 192.168.1.x)
- جهاز ZKTeco عادةً IPه الافتراضي: 192.168.1.201
- يعمل Node.js على جهاز السيرفر

### إعداد الشبكة (مرة واحدة)
إذا كان الجهاز مربوطاً مباشرة بالكمبيوتر (بدون راوتر)، اجعل IP بطاقة LAN ثابتاً:
```powershell
# 1. اكتشف اسم بطاقة الشبكة الموصولة بالجهاز
Get-NetAdapter | Where-Object Status -eq "Up"

# 2. اجعل IP ثابت (مثال: 192.168.1.100، القناع 255.255.255.0)
New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 192.168.1.100 -PrefixLength 24
```

### طريقة التشغيل
1. شغّل سيرفر البصمة (نافذة PowerShell منفصلة):
   ```powershell
   cd src/Jarash.Web
   node server/zk-bridge.mjs --ip=192.168.1.201
   ```
   يعرض السيرفر جميع بطاقات الشبكة المتاحة ليساعدك في تحديد IP الجهاز الصحيح.

2. شغّل السيرفر الرئيسي (نافذة أخرى):
   ```powershell
   .\start.ps1
   ```

3. في المتصفح → صفحة "الحضور" → تبويب **"جهاز البصمة"** ← أدخل IP الجهاز ← "اتصال"

### أوامر سيرفر البصمة
```powershell
node server/zk-bridge.mjs                    # يدوي — أدخل IP من الصفحة
node server/zk-bridge.mjs --ip=192.168.1.201  # اتصال تلقائي بجهاز معين
$env:ZK_IP="192.168.1.201"; node server/zk-bridge.mjs  # أو عبر متغير بيئة
```

### النتيجة
- البصمة تُسجل على جهاز ZKTeco
- النظام يسحب بيانات البصمات من الجهاز بشكل يدوي (زر مزامنة)
- الموظفون يُنشؤون تلقائياً في النظام
- تقارير الحضور والانصراف متاحة في صفحة التقارير

## الخطوات التالية
1. اختبار ثبات الرابط — `.\start.ps1` ثم فتح الرابط من الهاتف
2. اختبار التجربة الكاملة من الهاتف (حجز ← دفع ← إلغاء ← فاتورة)
3. اختبار سيناريوهات المشتريات (فاتورة ← دفعة ← تسوية ← مرتجع)
4. اختبار ربط جهاز ZKTeco من صفحة البصمة
5. مراجعة التقارير المالية المتبقية (التدفق النقدي، ميزان المراجعة)

## ملاحظة: تغير IP
إذا تغير IP مرّة أخرى، ما عليك سوى إعادة تشغيل `.\start.ps1` — سيكتشف السكريبت الـ IP الجديد تلقائياً ويعرض الرابط الصحيح مع QR code.

# SofizPay - الدفع الحقيقي عبر CIB / EDAHABIA

تمت إضافة بوابة الدفع الحقيقية **SofizPay** (SATIM) للمشروع ASSURINI. SofizPay هي بوابة جزائرية تسمح بقبول المدفوعات عبر بطاقات CIB و EDAHABIA بالدينار الجزائري (DZD).

## المميزات
- دفع حقيقي عبر SATIM (ليس محاكاة)
- دعم CIB و EDAHABIA بنفس الـ endpoint
- صفحة دفع مستضافة (hosted checkout) - بيانات البطاقة لا تمر عبر خوادمنا
- تحقق تلقائي من حالة الدفع عبر `cib-transaction-check`
- وضع Sandbox للاختبار بدون دفع حقيقي

## متطلبات التشغيل

### 1. إنشاء حساب تاجر SofizPay
1. سجل في https://merchant.sofizpay.com
2. من لوحة التحكم، انسخ **Account** (مفتاح Stellar العام `GD...`)
3. فعل **Testing Mode** للاختبار، أو اتركه معطل للإنتاج

### 2. إعداد متغيرات البيئة
أضف في `.env.local` (أو Vercel Env Vars):

```env
# SofizPay - الدفع الحقيقي
SOFIZPAY_ACCOUNT=GDNS27ISCGOIJFXC6CM4O5SVHVJPSWR42QEBWUFF24N5VVHGW73ZSJNQ
SOFIZPAY_BASE_URL=https://sofizpay.com
SOFIZPAY_SANDBOX=false

# للاختبار (Sandbox - محاكاة SATIM)
# SOFIZPAY_SANDBOX=true

# Chargily يبقى كـ fallback إذا لم يكن SofizPay مهيأ
CHARGILY_API_KEY=test_pk_...
CHARGILY_SECRET_KEY=test_sk_...
CHARGILY_BASE_URL=https://pay.chargily.net/test/api/v2
```

> **مهم:** `SOFIZPAY_ACCOUNT` يبدأ بـ `G` وهو المفتاح العام Stellar. لا تضع المفتاح السري. إذا لم يتم ضبط `SOFIZPAY_ACCOUNT` سيتم الرجوع تلقائياً إلى Chargily.

### 3. Firestore
تمت إضافة مجموعة `payments` لسجل المدفوعات. القواعد في `firestore.rules` تم تحديثها. انشر القواعد:
```bash
firebase deploy --only firestore:rules
```

## كيف يعمل

### إنشاء معاملة
```
POST /api/sofizpay/create-transaction
{
  "amount": 2500,
  "policyNumber": "ASNI-1234-567890",
  "fullName": "Ahmed Ben Ali",
  "phone": "+213555123456",
  "email": "ahmed@example.com",
  "locale": "fr",
  "successUrl": "https://yoursite.com/fr/checkout/success?policyNumber=ASNI-...",
  "memo": "ASNI-1234-567890"
}
→ Server يبني GET https://sofizpay.com/make-cib-transaction/?account=GD...&amount=2500&...
→ يحفظ cibTransactionId و sofizTransactionId في Firestore (contracts + payments)
→ يرجع { paymentUrl: "https://cib.satim.dz/payment/merchants/..." }
→ Frontend يحوّل المستخدم إلى paymentUrl
```

### التحقق بعد العودة
المستخدم يُعاد توجيهه إلى `return_url` ( success page ) مع `policyNumber` و `order_number`:
```
GET /fr/checkout/success?policyNumber=ASNI-...&order_number=2517039448
```
الصفحة تستدعي:
```
POST /api/sofizpay/check-transaction { policyNumber, order_number }
→ GET https://sofizpay.com/cib-transaction-check/?order_number=2517039448
→ إذا isPaid → يحدث contracts/{policyNumber} paymentStatus='paid'
→ يعرض عقد التأمين للتحميل
```

### Webhook / Callback
إذا اخترت `keep_return_url=True` (افتراضي)، SofizPay يوقع الـ callback. يوجد endpoint إضافي:
```
GET /api/sofizpay/webhook?policyNumber=ASNI-...&order_number=...&signature=...
→ يتحقق عبر cib-transaction-check ثم يحفظ paymentStatus
```
يمكنك ضبط `return_url` ليشير مباشرة إلى `/api/sofizpay/webhook` بدلاً من `/checkout/success` إذا أردت معالجة server-side ثم إعادة توجيه.

## واجهة المستخدم
- **PaymentForm** (`src/components/checkout/payment-form.tsx`) الآن يطلب رقم الهاتف (إلزامي لـ SofizPay) ويحاول SofizPay أولاً ثم يعود إلى Chargily إذا لزم.
- **صفحة النجاح** (`src/app/[locale]/checkout/success/page.tsx`) تتحقق تلقائياً من SofizPay كل 2 ثانية حتى 90 ثانية، مع دعم `order_number` من رابط العودة.
- **تعديل العقد** (`src/components/modify-contract/contract-modification-details.tsx`) يحاول أيضاً الدفع الحقيقي لرسوم التعديل، مع fallback لمحاكاة إذا لم يكن SofizPay مهيأ.

## وضع الاختبار (Sandbox)
1. في تطبيق SofizPay على الهاتف، فعّل **Testing Mode**.
2. ضع `SOFIZPAY_SANDBOX=true` و `SOFIZPAY_BASE_URL=https://sofizpay.com`
3. استدعي `GET https://sofizpay.com/sandbox/make-cib-transaction/` (يتم تلقائياً عند تفعيل Sandbox)
4. ستظهر المعاملات في التطبيق في وضع الاختبار، ولا يتم خصم مبلغ حقيقي.

## الترجمات
أضيفت مفاتيح جديدة في `messages/{fr,en,ar}.json`:
- `checkout.sofizpayNotice` + `sofizpayNoticeTitle`
- `checkout.phone` + `phoneHint`
- `validation.phoneRequired`

## استكشاف الأخطاء

| المشكلة | السبب | الحل |
|---|---|---|
| `SOFIZPAY_ACCOUNT missing` | المتغير غير مضبوط | ضع `GD...` في env |
| `payment_url not found` | خطأ في SofizPay أو رصيد | تأكد من `amount` >0 و `account` صحيح |
| `paymentStatus pending` طويلاً | لم يتم الدفع في SATIM | أعد التحقق يدوياً عبر `cib-transaction-check` أو تحقق في تطبيق SofizPay |
| التعديل لا يُطبق بعد الدفع | `pendingModification` في localStorage | صفحة `modify-contract/success` تطبق التعديل بعد verify. تأكد من عدم مسح localStorage |

## الأمان
- لا نمرر المفتاح السري؛ فقط `account` العام.
- `return_url` يجب أن يكون `https` في الإنتاج.
- نستخدم `keep_return_url=True` للحصول على توقيع مشفر، ونتحقق عبر `cib-transaction-check` قبل وضع `paymentStatus=paid` (مُستحسن حسب docs).
- بيانات البطاقة تبقى في صفحة SATIM المستضافة، لا نلمسها.

## المراجع
- Docs SofizPay: https://docs.sofizpay.com
- Endpoint CIB: `GET /make-cib-transaction/` و `GET /cib-transaction-check/`
- Example: `https://sofizpay.com/make-cib-transaction/?account=GD...&amount=150.75&full_name=...&phone=...&email=...&return_url=...&memo=...&redirect=yes&keep_return_url=True`

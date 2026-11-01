-- مطالبات طلباتٍ أُغلقت بلا اعتماد لا يُطالَب بها.
--
-- منذ هذا الإصدار، الطلب الذي يُلغى أو يُرفض نهائياً يسحب ما لم يُسدَّد من
-- مطالباته — رسومه ورسوم النادي المُرسِل — فلا تبقى في صفحة المدفوعات ديناً يُدفع
-- خطأً (requestFlowRunner.mjs). وهذا يسحب بالقاعدة نفسها ما بقي من قبل: طلبٌ
-- أُلغي بعد المطالبة برسومه وبقيت مطالبته «مطلوب الدفع».
--
-- لا يُمسّ إلا المطالبة غير المسدّدة (waiting) لطلبٍ مغلق (cancelled أو
-- rejected_final). ما رُفع إيصاله أو اعتُمد يبقى كما هو.
--
-- حذفٌ ناعم (deletedAt) — يُسترجع بإعادة deletedAt إلى NULL. ومتكرر الأمان:
-- إعادة تشغيله لا تجد صفاً.

UPDATE request_payments p
JOIN request_flows f
  ON f.entity_type = p.entity_type
 AND f.entity_id   = p.entity_id
SET p.deletedAt = NOW()
WHERE p.status = 'waiting'
  AND p.deletedAt IS NULL
  AND f.stage IN ('cancelled', 'rejected_final');

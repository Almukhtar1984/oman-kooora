import dayjs from "dayjs";

// مستندات «تسجيل عضو جديد» (العميل، 2026-11-19): «استمارة طلب العضوية، وإذا كان
// أقل من 18 تعهد ولي الأمر — هذا بالنسبة لتسجيل العضوية». والخادم يقرّر الشيء نفسه
// (memberRegistration.mjs)، فلا يصل إلى النادي طلبٌ ناقص.

export const GUARDIAN_AGE = 18;
/** طلب الرفع يحمل عشرة ملفات: خمسة للصور والاستمارتين، وخمسة للمرفقات الأخرى. */
export const MAX_EXTRA_ATTACHMENTS = 5;
export const MAX_FILE_MB = 10;
export const DOCUMENT_TYPES = ".pdf,.jpg,.jpeg,.png,.doc,.docx";

/** العضو دون 18 سنة يحتاج تعهد ولي الأمر. */
export const needsGuardian = (birth: Date | string | null | undefined, today = new Date()) =>
    Boolean(birth) && dayjs(birth).isValid() && dayjs(today).diff(dayjs(birth), "year") < GUARDIAN_AGE;

export const tooBig = (file: File | null | undefined) => Boolean(file && file.size > MAX_FILE_MB * 1024 ** 2);

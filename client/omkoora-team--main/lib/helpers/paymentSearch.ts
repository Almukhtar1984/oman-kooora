// البحث في المدفوعات — باسم اللاعب أو رقمه المدني أو الرقم المرجعي للتحويل أو
// الفريق: «هل ممكن بالرقم المدني… في الانتقالات، في الإعارات، في الدفعات، في كل
// شيء» (العميل). وبالرقم المرجعي تُجمع مطالبات الإيصال الواحد معاً.

const fold = (text: unknown) => String(text ?? "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();

export const matchesPayment = (row: any, query: string): boolean => {
    const needle = fold(query);
    if (!needle) return true;
    return [row?.subject, row?.subject_card, row?.reference_number, row?.team?.name, row?.label, row?.note]
        .some((value) => fold(value).includes(needle));
};

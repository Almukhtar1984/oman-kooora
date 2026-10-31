// موقع النادي من انتقالٍ أو إعارة في سلسلة الناديين.
//
// النادي المُرسِل في انتقالٍ إلى نادٍ آخر لا يختار فريقاً يستقبل اللاعب — ليس
// لاعبه بعد اليوم — بل يقرّر رسومه إن شاء: «النادي هذا يأخذ رسوم… وفي بعض
// الأحيان بدون رسوم» (العميل). والمستقبِل يختار الفريق. وفي الانتقال الداخلي
// النادي واحد، فهو المستقبِل.

export type TransferSide = "sending" | "receiving";

export const transferSide = (transfer: any, myClubId?: string | null): TransferSide => {
    const from = transfer?.team_from?.club?.id || transfer?.club_from?.id || null;
    const to = transfer?.team_to?.club?.id || transfer?.club_to?.id || null;
    return myClubId && from === myClubId && to && to !== myClubId ? "sending" : "receiving";
};

/** نوع رسوم الطلب في قائمة أسعار النادي. */
export const transferFeeType = (transfer: any) => (transfer?.transition_type === "loan" ? "loan" : "transfer");

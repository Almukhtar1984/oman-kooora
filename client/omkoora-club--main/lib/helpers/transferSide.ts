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

/** سعر النادي المُرسِل في قائمته: لا يكون له رسوم إلا على ما يخرج إلى نادٍ آخر. */
export const transferFeeType = (transfer: any) =>
    (transfer?.transition_type === "loan" ? "loan_external" : "transfer_external") as "loan_external" | "transfer_external";

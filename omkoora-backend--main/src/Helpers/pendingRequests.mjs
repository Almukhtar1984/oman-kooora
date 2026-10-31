// ما ينتظر قرار النادي، مجموعاً في مكان واحد.
//
// A club chases its pending work across six screens today: new players, new
// technical staff, new board members, transfers, loans, news to approve — and
// now resignations. With forty-five teams sending requests, whatever is not on
// the screen in front of you is forgotten.
//
// The counter is deliberately a count of work, not of notifications: it is
// derived from the records that still need a decision, so it cannot fall by
// opening the list — only by deciding something. That is the rule the owner
// asked for, and deriving it is also the only way to keep it honest.
//
// Pure shaping only — no DB, no IO. The resolver counts, this names and orders.

export const REQUEST_TYPES = [
    { key: "players",    label: "تسجيل لاعبين",        href: "/players" },
    { key: "technicals", label: "تسجيل جهاز فني",      href: "/technicalApparatus" },
    { key: "members",    label: "تسجيل مجلس إدارة",    href: "/members" },
    { key: "transfers",  label: "انتقالات اللاعبين",   href: "/players_transfer" },
    { key: "loans",      label: "إعارات اللاعبين",     href: "/players_loan" },
    { key: "releases",   label: "طلبات إخلاء الطرف",   href: "/releases" },
    { key: "teams",      label: "تسجيل فرق",           href: "/tracking" },
    { key: "payments",   label: "إيصالات بانتظار الاعتماد", href: "/payments" },
    { key: "news",       label: "أخبار بانتظار الاعتماد", href: "/blog" },
];

// وما ينتظر الفريق نفسه — الوجه الآخر للعدّاد. الفريق لا يقرّر في طلبات
// غيره؛ عمله أن يسدّد ما طُولب به، وأن يعدّل ما أعاده النادي ويعيد إرساله،
// وأن يردّ على طلبات لاعبيه.
export const TEAM_REQUEST_TYPES = [
    { key: "payments",       label: "رسوم بانتظار السداد",          href: "/payments" },
    { key: "returned",       label: "طلبات أعادها النادي للتعديل",  href: "/tracking" },
    { key: "playerRequests", label: "طلبات اللاعبين بانتظار ردّك",  href: "/requests" },
];

const summarize = (types, counts = {}) => {
    const groups = types
        .map(({ key, label, href }) => ({ key, label, href, count: Number(counts[key]) || 0 }))
        .filter((group) => group.count > 0);

    return {
        total: groups.reduce((sum, group) => sum + group.count, 0),
        groups,
    };
};

/**
 * Turn raw counts into the list the club reads, newest concern first.
 *
 * Groups with nothing pending are dropped: a list of zeros is noise, and the
 * club is looking for what needs doing, not for a report.
 *
 * @param {Record<string, number>} counts  keyed by the types above
 */
export const summarizePending = (counts = {}) => summarize(REQUEST_TYPES, counts);

/** والشيء نفسه للفريق، بأنواعه هو. */
export const summarizeTeamPending = (counts = {}) => summarize(TEAM_REQUEST_TYPES, counts);

/**
 * المطالبات التي ما زالت تُطلب: ما أُلغي طلبه أو رُفض نهائياً لا يُطالَب برسومه،
 * وإن بقيت مطالبته «بانتظار السداد» في السجل. والمطالبة بلا طلبٍ — رسومٌ
 * يطالب بها النادي مباشرة — حيّةٌ حتى تُسدَّد.
 *
 * @param {{entity_type?: string, entity_id?: string}[]} payments  مطالبات بانتظار السداد
 * @param {{entity_type?: string, entity_id?: string}[]} closed    طلباتٌ انتهت بلا اعتماد
 */
export const liveCharges = (payments = [], closed = []) => {
    const key = (row) => `${row?.entity_type}:${row?.entity_id}`;
    const dead = new Set((closed || []).map(key));
    return (payments || []).filter((payment) => !(payment?.entity_id && dead.has(key(payment))));
};

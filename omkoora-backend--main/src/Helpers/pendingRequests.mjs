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
    { key: "payments",   label: "إيصالات بانتظار الاعتماد", href: "/payments" },
    { key: "news",       label: "أخبار بانتظار الاعتماد", href: "/blog" },
];

/**
 * Turn raw counts into the list the club reads, newest concern first.
 *
 * Groups with nothing pending are dropped: a list of zeros is noise, and the
 * club is looking for what needs doing, not for a report.
 *
 * @param {Record<string, number>} counts  keyed by the types above
 */
export const summarizePending = (counts = {}) => {
    const groups = REQUEST_TYPES
        .map(({ key, label, href }) => ({ key, label, href, count: Number(counts[key]) || 0 }))
        .filter((group) => group.count > 0);

    return {
        total: groups.reduce((sum, group) => sum + group.count, 0),
        groups,
    };
};

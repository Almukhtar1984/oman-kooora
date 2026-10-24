// العضوية الموحّدة: اللاعبون والجهاز الفني ومجلس الإدارة وأعضاء الجمعية في
// قائمة واحدة، لكل منهم تصنيفه.
//
// The club's membership lives in four tables, and the screen that was meant to
// show "the members" showed only the fourth — so a club with hundreds of
// players read "لا يوجد بيانات" and concluded the platform had lost them.
//
// The four tables stay as they are. In particular the assembly register keeps
// its own columns — membership number, membership date, subscription — which
// the owner asked explicitly not to lose in any merge. What is unified is the
// reading of them, not the storing.

export const MEMBERSHIP_KINDS = [
    { kind: "player",    label: "لاعب" },
    { kind: "technical", label: "جهاز فني" },
    { kind: "board",     label: "مجلس إدارة" },
    { kind: "assembly",  label: "عضو أساسي" },
];

const KIND_KEYS = MEMBERSHIP_KINDS.map((k) => k.kind);

export const kindLabel = (kind) =>
    MEMBERSHIP_KINDS.find((k) => k.kind === kind)?.label || "";

/**
 * Clean what the client asked for before it reaches SQL.
 *
 * An unknown classification or status is dropped rather than passed through:
 * a filter nobody can satisfy would read as "the club has no members", which
 * is the exact misunderstanding this screen exists to end.
 */
export const normalizeMembershipFilters = ({ kind, status, search, page, limit } = {}) => {
    const cleanLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const cleanPage = Math.max(Number(page) || 1, 1);
    const term = String(search ?? "").trim();

    return {
        kind: KIND_KEYS.includes(kind) ? kind : null,
        status: ["accepted", "waiting", "waiting_club", "rejected", "suspended"].includes(status) ? status : null,
        search: term || null,
        limit: cleanLimit,
        offset: (cleanPage - 1) * cleanLimit,
        page: cleanPage,
    };
};

/** Counts per classification, every kind present even at zero. */
export const membershipCounts = (rawCounts = []) => {
    const found = new Map(rawCounts.map((row) => [row.kind, Number(row.count) || 0]));
    return MEMBERSHIP_KINDS.map(({ kind, label }) => ({
        kind,
        label,
        count: found.get(kind) || 0,
    }));
};

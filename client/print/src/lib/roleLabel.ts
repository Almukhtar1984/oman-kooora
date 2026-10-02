// "الصفة" on a printed card is the role the person holds inside the club
// (مدرب / مساعد مدرب / طبي / اعلامي / عضو …) — it is `classification`.
//
// The person's day job — `occupation`: موظف / متقاعد / طالب / عسكري — is
// private and must NEVER be printed on a card. A card went out reading
// "الصفة: متقاعد" because the single-card route passed `occupation` straight
// through, so nothing here falls back to it.
//
// Some rows still hold internal codes instead of an Arabic label: the member
// ones are mapped, and the age categories are not roles at all, so they print
// nothing rather than leaking "firstDegree" onto a card.

const ROLE_CODES: Record<string, string> = {
    member: "عضو",
    manager: "مدير الفريق",
    technical: "الجهاز الفني",
    admin: "إداري",
};

const NOT_A_ROLE = new Set(["firstDegree", "secondDegree", "young", "rookies"]);

/** The role to print as "الصفة", or null when there is nothing printable. */
export const roleLabel = (entity: any): string | null => {
    const raw = String(entity?.classification ?? "").trim();
    if (!raw || NOT_A_ROLE.has(raw)) return null;
    return ROLE_CODES[raw] ?? raw;
};

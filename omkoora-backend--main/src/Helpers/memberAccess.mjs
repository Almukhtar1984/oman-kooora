// مَن يلمس سجلّ العضوية.
//
// كانت createAssembly وupdateAssembly وdeleteAssembly تكتفي بأن يكون المستدعي
// مسجّلاً دخوله: أيّ حساب — نادٍ آخر، فريقٌ آخر، حكم مباراة — يعدّل عضواً أو
// يحذفه بمعرّفه، والأرقام المدنية والهواتف فيها. الآن:
//
//   - مدير النظام (1): كل سجل.
//   - النادي (2): أعضاء ناديه — ومنهم من سجّله فريقٌ من فرقه بلا id_club
//     (314 سجلاً على الخادم يوم كُتب هذا)، فناديه نادي فريقه.
//   - الفريق (3): أعضاء فريقه وحدهم — وهم ما تعرضه له «العضوية».
//   - ما سواها (الدوري، الحكام، الملاعب، الأكاديميات، المتاجر): لا شيء.
//
// قرارات محضة: الـresolver يجلب نادي المستدعي وفريقه، وسجلّ العضو ونادي فريقه.

export const SUPER_ADMIN_ROLE = "1";
export const CLUB_ADMIN_ROLE = "2";
export const TEAM_ADMIN_ROLE = "3";

const same = (a, b) => Boolean(a && b && String(a) === String(b));

const forbidden = (message) => ({ code: "FORBIDDEN_MEMBER", message });
const NO_ROLE = { code: "FORBIDDEN_ROLE", message: "لا يملك هذا الحساب تعديل العضوية" };

/**
 * لماذا لا يعدّل هذا المستدعي هذا العضو أو يحذفه — أو null إن جاز.
 *
 * @param {object} caller  { role, idClub, idTeam } — نادي المستدعي وفريقه
 * @param {object} member  { id_club, id_team, teamClub } — teamClub: نادي فريق العضو
 */
export const memberAccessProblem = (caller = {}, member = null) => {
    if (!member) return { code: "MEMBER_NOT_FOUND", message: "العضو غير موجود" };
    const role = String(caller?.role ?? "");
    if (role === SUPER_ADMIN_ROLE) return null;
    if (role === CLUB_ADMIN_ROLE) {
        return same(caller.idClub, member.id_club || member.teamClub) ? null : forbidden("هذا العضو لا يتبع ناديك");
    }
    if (role === TEAM_ADMIN_ROLE) {
        return same(caller.idTeam, member.id_team) ? null : forbidden("هذا العضو ليس في فريقك");
    }
    return NO_ROLE;
};

/**
 * لماذا لا يُنشئ هذا المستدعي عضواً بهذا النادي وهذا الفريق — أو null إن جاز.
 *
 * @param {object} caller  { role, idClub, idTeam }
 * @param {object} target  { id_club, id_team, teamClub } — ما في الطلب، ونادي فريقه
 */
export const memberCreateProblem = (caller = {}, target = {}) => {
    const role = String(caller?.role ?? "");
    if (role === SUPER_ADMIN_ROLE) return null;
    if (role === CLUB_ADMIN_ROLE) {
        if (!caller.idClub) return forbidden("حسابك غير مرتبط بنادٍ");
        if (target.id_club && !same(target.id_club, caller.idClub)) return forbidden("لا تُسجَّل العضوية في نادٍ آخر");
        if (target.id_team && !same(target.teamClub, caller.idClub)) return forbidden("الفريق المختار لا يتبع ناديك");
        return null;
    }
    if (role === TEAM_ADMIN_ROLE) {
        if (!caller.idTeam) return forbidden("حسابك غير مرتبط بفريق");
        if (target.id_team && !same(target.id_team, caller.idTeam)) return forbidden("لا تُسجَّل العضوية في فريقٍ آخر");
        if (target.id_club && caller.idClub && !same(target.id_club, caller.idClub)) return forbidden("لا تُسجَّل العضوية في نادٍ آخر");
        return null;
    }
    return NO_ROLE;
};

/** إضافة أهل النادي إلى العضوية دفعةً واحدة: ناديه هو، أو مدير النظام. */
export const clubBulkProblem = (caller = {}, idClub = null) => {
    const role = String(caller?.role ?? "");
    if (role === SUPER_ADMIN_ROLE) return null;
    if (role === CLUB_ADMIN_ROLE) return same(caller.idClub, idClub) ? null : forbidden("هذا ليس ناديك");
    return NO_ROLE;
};

/**
 * ما لا يُغيَّر بالتعديل إلا من مدير النظام: نادي العضو وفريقه.
 * الانتقال بين الفرق له طريقه، لا «تعديل» يكتب id_team آخر.
 */
export const ownershipFieldsFor = (caller = {}, fields = {}) => {
    if (String(caller?.role ?? "") === SUPER_ADMIN_ROLE) return fields;
    const { id_club, id_team, ...rest } = fields;
    return rest;
};

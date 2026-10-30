// ما تفعله نهاية الطريق بالطلب نفسه — الجانب الذي يلمس قاعدة البيانات.
//
// The decision of WHICH outcome a stage carries is pure (requestFlow.outcomeOf);
// this file performs it. A transfer moves its player only here, at the final
// approval — never at the moment the two clubs agree — because the owner's rule
// is that nothing passes without the club's approval AND its fee.

import logger from "../Config/logger.mjs";
import { PlayerRelease, Players, TechnicalApparatus, Transfer } from "../Models/index.mjs";
import { CreateNotificationTeam } from "./Notification.mjs";

/** اللاعب أو عضو الجهاز الفني الذي يخصّه الانتقال. */
const subjectOf = (transfer) => {
    const isTech = !transfer.id_player && !!transfer.id_technical_apparatus;
    return {
        Model: isTech ? TechnicalApparatus : Players,
        id: isTech ? transfer.id_technical_apparatus : transfer.id_player,
        type: isTech ? "technical" : "player",
    };
};

/**
 * هل يمكن تنفيذ هذا الأثر الآن؟ يُسأل قبل نقل الطلب، كي لا يُعتمد طلبٌ لا يمكن
 * تنفيذه — لاعبٌ يُعتمد انتقاله ولا فريق ينتقل إليه.
 */
export const outcomeBlocker = async (flow, outcome) => {
    if (outcome !== "finalize") return null;
    const transfer = await Transfer.findByPk(flow.entity_id);
    if (!transfer) return { code: "TRANSFER_NOT_FOUND", message: "سجلّ الانتقال غير موجود" };
    if (!transfer.id_team_to) {
        return {
            code: "TRANSFER_TEAM_REQUIRED",
            message: "اختر الفريق الذي سينضم إليه اللاعب في ناديك قبل الاعتماد النهائي",
        };
    }
    return null;
};

const finalizeTransfer = async (flow) => {
    const transfer = await Transfer.findByPk(flow.entity_id);
    if (!transfer) return;
    const subject = subjectOf(transfer);

    // تاريخ الانتقال هو تاريخ اعتماده — لا يكتبه أحد.
    await transfer.update({ status: "accepted", date_start: transfer.date_start || new Date() });
    await subject.Model.update(
        { status: "accepted", id_team: transfer.id_team_to },
        { where: { id: subject.id } },
    );
    if (transfer.transition_type === "loan" && transfer.id_team_from) {
        void CreateNotificationTeam("loan", "accepted", transfer.id_team_from, subject.id, subject.type);
    }
};

const abandonTransfer = async (flow) => {
    const transfer = await Transfer.findByPk(flow.entity_id);
    if (!transfer) return;
    const subject = subjectOf(transfer);

    await transfer.update({ status: "rejected" });
    // اللاعب باقٍ في فريقه، ويعود فاعلاً كما كان قبل الطلب.
    await subject.Model.update(
        { status: "accepted" },
        { where: { id: subject.id, status: "waiting_club" } },
    );
    if (transfer.transition_type === "loan" && transfer.id_team_from) {
        void CreateNotificationTeam("loan", "rejected", transfer.id_team_from, subject.id, subject.type);
    }
};

const releasePlayer = async (flow, { id_user }) => {
    const release = await PlayerRelease.findByPk(flow.entity_id);
    if (!release) return;
    await release.update({ status: "accepted", decided_at: new Date(), id_decided_by: id_user || null });
    // الغاية كلها: يخرج من فريقه ويصير قابلاً للتسجيل في غيره. وسجلّه وسجلّ
    // الاستقالة يحفظان من أين جاء.
    await Players.update({ id_team: null }, { where: { id: release.id_player } });
    if (release.id_team) {
        void CreateNotificationTeam("player", "accepted", release.id_team, release.id_player, "player");
    }
};

const refuseRelease = async (flow, { id_user, reason }) => {
    const release = await PlayerRelease.findByPk(flow.entity_id);
    if (!release) return;
    await release.update({
        status: "rejected", note: reason || release.note || null,
        decided_at: new Date(), id_decided_by: id_user || null,
    });
    if (release.id_team) {
        void CreateNotificationTeam("player", "rejected", release.id_team, release.id_player, "player");
    }
};

const PERFORM = {
    finalize: finalizeTransfer,
    abandon: abandonTransfer,
    release: releasePlayer,
    refuse: refuseRelease,
};

/** ينفّذ الأثر. يرمي عند الفشل، كي يُعاد الطلب إلى مرحلته ولا يُعتمد على الورق وحده. */
export const performOutcome = async (flow, outcome, context = {}) => {
    const perform = PERFORM[outcome];
    if (!perform) return;
    try {
        await perform(flow, context);
    } catch (error) {
        logger.error(`requestOutcomes.${outcome}: ${error?.message || error}`);
        throw error;
    }
};

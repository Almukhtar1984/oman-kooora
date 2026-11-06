// رسوم التسجيل في المسابقات.
//
// «كذلك مثل المسابقات… مبلغ يكون فيهم تسجيل مسابقات» (العميل، 2026-11-05). النادي
// صاحب المسابقة يسعّرها في قائمته، فإذا قبل الفريق المشاركة طولب بها من «المدفوعات».
// لا سعر مفعّل، لا مطالبة — والنادي الذي لم يسعّرها لا يتغيّر عليه شيء. والمطالبة
// لا توقف المشاركة: المسابقة لها مسارها، والتسجيل فيها أهمّ من أن يتعطّل بخطأ هنا.

import logger from "../Config/logger.mjs";
import { ClubFee, League, ParticipatingTeams, RequestPayment } from "../Models/index.mjs";
import { feeLabel, normalizeAmount, PAYMENT_WAITING } from "./clubFees.mjs";
import { CreateDirectNotification } from "./Notification.mjs";

const FEE_TYPE = "competition_registration";
const ENTITY = "participating_team";

export const raiseCompetitionFee = async (idParticipating, { id_user = null } = {}) => {
    try {
        const participation = await ParticipatingTeams.findByPk(idParticipating);
        if (!participation?.id_team || !participation?.id_league) return null;

        const league = await League.findByPk(participation.id_league, { attributes: ["id", "name", "id_club"] });
        if (!league?.id_club) return null;

        const price = await ClubFee.findOne({ where: { id_club: league.id_club, fee_type: FEE_TYPE } });
        const amount = price?.active ? normalizeAmount(price.amount) : null;
        if (!amount) return null;

        // قبولٌ ثانٍ بعد رفضٍ لا يُطالب مرتين بما لم يُسدَّد بعد ولا بما سُدّد.
        const existing = await RequestPayment.findOne({ where: { entity_type: ENTITY, entity_id: participation.id } });
        if (existing) return existing;

        const payment = await RequestPayment.create({
            fee_type: FEE_TYPE,
            amount,
            entity_type: ENTITY,
            entity_id: participation.id,
            status: PAYMENT_WAITING,
            note: `التسجيل في مسابقة «${league.name}»`,
            id_club: league.id_club,
            id_team: participation.id_team,
            id_requested_by: id_user,
        });
        void CreateDirectNotification({
            id_team: participation.id_team,
            body: `رسوم ${feeLabel(FEE_TYPE)} «${league.name}»: مطلوب سداد ${amount} ر.ع — من «المدفوعات»`,
        });
        return payment;
    } catch (error) {
        logger.error(`competitionFee.raise: ${error?.message || error}`);
        return null;
    }
};

/** مشاركةٌ رُفضت أو حُذفت لا تبقى رسومها غير المسدّدة ديناً على الفريق. */
export const withdrawCompetitionFee = async (idParticipating) => {
    try {
        await RequestPayment.destroy({
            where: { entity_type: ENTITY, entity_id: idParticipating, status: PAYMENT_WAITING },
        });
    } catch (error) {
        logger.error(`competitionFee.withdraw: ${error?.message || error}`);
    }
};

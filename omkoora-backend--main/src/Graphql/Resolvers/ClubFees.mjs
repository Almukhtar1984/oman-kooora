import { ApolloError } from 'apollo-server-express';
import { createWriteStream } from "fs";
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";
import { __dirname } from "../../app.mjs";
import { Club, ClubFee, Person, PlayerRelease, Players, RequestPayment, Team, Transfer } from '../../Models/index.mjs';
import { callerClubId, callerTeamId, clubOfTeam } from "../../Helpers/clubScope.mjs";
import { onReceiptSubmitted, onReceiptRejected } from "../../Helpers/requestFlowRunner.mjs";
import { CreateDirectNotification } from "../../Helpers/index.mjs";
import {
    FEE_TYPES, feeLabel, isFeeType, normalizeAmount,
    canSubmitReceipt, canSubmitBatchReceipt, paymentDecision,
    PAYMENT_WAITING, PAYMENT_SUBMITTED, PAYMENT_ACCEPTED,
} from "../../Helpers/clubFees.mjs";

const CLUB_ADMIN_ROLE = "2";
const SUPER_ADMIN_ROLE = "1";

const RECEIPT_TYPES = ["JPEG", "JPG", "PNG", "PDF"];

const storeReceipt = async (upload) => {
    const { createReadStream, filename } = await upload;
    const parts = String(filename || "").split(".");
    const type = parts[parts.length - 1].toUpperCase();

    if (!RECEIPT_TYPES.includes(type)) {
        throw new ApolloError("صيغة الإيصال غير مدعومة (صورة أو PDF)", "RECEIPT_TYPE_UNSUPPORTED");
    }

    const uniqueName = `${UUID()}.${type}`;
    await createReadStream().pipe(createWriteStream(path.join(__dirname, `./../uploads/${uniqueName}`)));
    return uniqueName;
};

export const resolvers = {
    Query: {
        clubFees: async (obj, args, context) => {
            try {
                const idClub = await callerClubId(context);
                if (!idClub) return [];

                const stored = await ClubFee.findAll({ where: { id_club: idClub } });
                const byType = new Map(stored.map((fee) => [fee.fee_type, fee]));

                // Every type is returned, priced or not: a club setting its
                // prices needs to see what it has not priced yet.
                return FEE_TYPES.map(({ type, label }) => {
                    const fee = byType.get(type);
                    return {
                        id: fee?.id || null,
                        fee_type: type,
                        label,
                        amount: fee ? Number(fee.amount) : 0,
                        active: fee ? Boolean(fee.active) : false,
                    };
                });
            } catch (error) {
                logger.error(`ClubFees.clubFees: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        requestPayments: async (obj, { status, idTeam }, context) => {
            try {
                const where = {};
                const idClub = await callerClubId(context);
                const myTeam = await callerTeamId(context);

                if (myTeam) where.id_team = myTeam;            // الفريق يرى مدفوعاته
                else if (idClub) where.id_club = idClub;        // والنادي يرى مدفوعات ناديه
                if (idTeam && !myTeam) where.id_team = idTeam;
                if (status) where.status = status;

                const rows = await RequestPayment.findAll({ where, order: [["createdAt", "DESC"]] });
                return rows.map((row) => ({ ...row.get({ plain: true }), label: feeLabel(row.fee_type) }));
            } catch (error) {
                logger.error(`ClubFees.requestPayments: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },

    Mutation: {
        saveClubFee: async (obj, { fee_type, amount, active }, context) => {
            try {
                const role = context?.user?.role;
                const idClub = await callerClubId(context);
                if (!idClub || (role !== CLUB_ADMIN_ROLE && role !== SUPER_ADMIN_ROLE)) {
                    throw new ApolloError("ضبط الرسوم من صلاحية النادي", "FORBIDDEN_FEES");
                }
                if (!isFeeType(fee_type)) {
                    throw new ApolloError("نوع رسوم غير معروف", "FEE_TYPE_UNKNOWN");
                }

                const value = normalizeAmount(amount ?? 0);
                if (value === null) throw new ApolloError("المبلغ غير صحيح", "AMOUNT_INVALID");

                const [fee] = await ClubFee.findOrCreate({
                    where: { id_club: idClub, fee_type },
                    defaults: { id_club: idClub, fee_type, amount: value, active: active ?? true },
                });
                await fee.update({ amount: value, active: active ?? fee.active });

                return {
                    id: fee.id,
                    fee_type,
                    label: feeLabel(fee_type),
                    amount: Number(fee.amount),
                    active: Boolean(fee.active),
                };
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error(`ClubFees.saveClubFee: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        createRequestPayment: async (obj, { content }, context) => {
            try {
                const role = context?.user?.role;
                const idClub = await callerClubId(context);
                if (!idClub || (role !== CLUB_ADMIN_ROLE && role !== SUPER_ADMIN_ROLE)) {
                    throw new ApolloError("مطالبة الفريق بالرسوم من صلاحية النادي", "FORBIDDEN_FEES");
                }
                if (!isFeeType(content.fee_type)) {
                    throw new ApolloError("نوع رسوم غير معروف", "FEE_TYPE_UNKNOWN");
                }

                const teamClub = await clubOfTeam(content.id_team);
                if (teamClub && teamClub !== idClub) {
                    throw new ApolloError("هذا الفريق لا يتبع ناديك", "TEAM_NOT_IN_CLUB");
                }

                // The club's own price unless it overrides it for this request.
                const stored = await ClubFee.findOne({ where: { id_club: idClub, fee_type: content.fee_type } });
                const amount = normalizeAmount(content.amount ?? stored?.amount ?? 0);
                if (amount === null) throw new ApolloError("المبلغ غير صحيح", "AMOUNT_INVALID");

                const payment = await RequestPayment.create({
                    fee_type: content.fee_type,
                    amount,
                    entity_type: content.entity_type || null,
                    entity_id: content.entity_id || null,
                    note: content.note || null,
                    status: PAYMENT_WAITING,
                    id_club: idClub,
                    id_team: content.id_team,
                    id_requested_by: context?.user?.id || null,
                });

                // The team is told what it owes and for what — a fee nobody
                // announced is a fee nobody pays.
                void CreateDirectNotification({
                    id_team: payment.id_team,
                    body: `رسوم ${feeLabel(payment.fee_type)}: مطلوب دفع ${amount} ر.ع`
                        + (content.note ? ` — ${content.note}` : ""),
                });

                return { ...payment.get({ plain: true }), label: feeLabel(payment.fee_type) };
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error(`ClubFees.createRequestPayment: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        submitPaymentReceipt: async (obj, { id, reference_number, receipt, amount }, context) => {
            try {
                const payment = await RequestPayment.findByPk(id);
                const myTeam = await callerTeamId(context);
                const idClub = await callerClubId(context);

                if (payment && myTeam && payment.id_team !== myTeam) {
                    throw new ApolloError("هذا الدفع لا يخصّ فريقك", "FORBIDDEN_PAYMENT");
                }
                if (payment && !myTeam && idClub && payment.id_club !== idClub) {
                    throw new ApolloError("هذا الدفع لا يخصّ ناديك", "FORBIDDEN_PAYMENT");
                }

                const verdict = canSubmitReceipt(payment, { reference_number, amount });
                if (!verdict.ok) throw new ApolloError(verdict.message, verdict.code);

                const stored = receipt ? await storeReceipt(receipt) : payment.receipt;

                await payment.update({
                    reference_number: String(reference_number).trim(),
                    receipt: stored,
                    status: PAYMENT_SUBMITTED,
                    paid_at: new Date(),
                    // The previous rejection is answered by this receipt.
                    decision_note: null,
                });

                const team = payment.id_team ? await Team.findByPk(payment.id_team) : null;
                void CreateDirectNotification({
                    id_club: payment.id_club,
                    body: `${team?.name || "فريق"} رفع إيصال رسوم ${feeLabel(payment.fee_type)}`
                        + ` (${Number(payment.amount)} ر.ع) بانتظار اعتمادك`,
                });

                // والطلب الذي تسدّده هذه الدفعة ينتقل معها إلى مراجعة النادي:
                // المالك أراد السداد مرحلةً في الطلب لا سجلّاً إلى جواره.
                await onReceiptSubmitted(payment, { id_user: context?.user?.id || null });

                return { status: true };
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error(`ClubFees.submitPaymentReceipt: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        submitPaymentsReceipt: async (obj, { ids, reference_number, receipt, amount }, context) => {
            try {
                const myTeam = await callerTeamId(context);
                const idClub = await callerClubId(context);
                const payments = await RequestPayment.findAll({ where: { id: ids || [] } });

                const foreign = payments.some((payment) => (myTeam
                    ? payment.id_team !== myTeam
                    : !idClub || payment.id_club !== idClub));
                if (foreign || payments.length !== new Set(ids || []).size) {
                    throw new ApolloError("بين المختار مطالبةٌ لا تخصّك", "FORBIDDEN_PAYMENT");
                }

                const verdict = canSubmitBatchReceipt(payments, { reference_number, amount });
                if (!verdict.ok) throw new ApolloError(verdict.message, verdict.code);

                // إيصالٌ واحد يُحفظ مرة، وتحمله كل مطالبة سدّدها — فيرى النادي
                // كل جزءٍ عند طلبه، ويرى أنها تحويلٌ واحد برقمه.
                const stored = receipt ? await storeReceipt(receipt) : null;
                const reference = String(reference_number).trim();
                for (const payment of payments) {
                    await payment.update({
                        reference_number: reference,
                        receipt: stored,
                        status: PAYMENT_SUBMITTED,
                        paid_at: new Date(),
                        decision_note: null,
                    });
                    await onReceiptSubmitted(payment, { id_user: context?.user?.id || null });
                }

                const team = payments[0]?.id_team ? await Team.findByPk(payments[0].id_team) : null;
                void CreateDirectNotification({
                    id_club: payments[0].id_club,
                    body: `${team?.name || "فريق"} رفع إيصالاً واحداً (${reference}) يسدّد ${payments.length}`
                        + ` مطالبات بمجموع ${verdict.total} ر.ع — بانتظار اعتمادك`,
                });

                return { status: true, message: `سُدّدت ${payments.length} مطالبات بإيصال واحد (${verdict.total} ر.ع)` };
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error(`ClubFees.submitPaymentsReceipt: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        decidePayment: async (obj, { id, status, note }, context) => {
            try {
                const payment = await RequestPayment.findByPk(id);
                if (!payment) throw new ApolloError("طلب الدفع غير موجود", "PAYMENT_NOT_FOUND");

                const role = context?.user?.role;
                const idClub = await callerClubId(context);
                const isOwningClub = role === CLUB_ADMIN_ROLE && idClub && idClub === payment.id_club;
                if (!isOwningClub && role !== SUPER_ADMIN_ROLE) {
                    throw new ApolloError("اعتماد الإيصال من صلاحية النادي", "FORBIDDEN_PAYMENT_DECISION");
                }

                const decision = paymentDecision(payment.status, status);
                if (!decision.valid) {
                    throw new ApolloError(
                        payment.status === PAYMENT_ACCEPTED
                            ? "هذا الدفع معتمد مسبقاً"
                            : "قرار غير مفهوم — اعتماد أو رفض",
                        "PAYMENT_DECISION_INVALID"
                    );
                }

                await payment.update({
                    status: decision.status,
                    decision_note: note || null,
                    decided_at: new Date(),
                    id_decided_by: context?.user?.id || null,
                    // A rejected receipt leaves the payment owed, and the
                    // previous receipt is cleared so the team sends a new one.
                    ...(decision.rejected ? { receipt: null, reference_number: null, paid_at: null } : {}),
                });

                if (decision.rejected) {
                    await onReceiptRejected(payment, {
                        reason: note || null,
                        id_user: context?.user?.id || null,
                    });
                }

                void CreateDirectNotification({
                    id_team: payment.id_team,
                    body: decision.rejected
                        // The reason travels with the rejection; otherwise the
                        // team resubmits the same receipt and nothing moves.
                        ? `تم رفض إيصال رسوم ${feeLabel(payment.fee_type)}${note ? ` — ${note}` : ""} — أعد رفع الإيصال`
                        : `تم اعتماد إيصال رسوم ${feeLabel(payment.fee_type)} (${Number(payment.amount)} ر.ع)`,
                });

                return { status: true };
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error(`ClubFees.decidePayment: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },

    RequestPayment: {
        // اسم اللاعب الذي تسدّد عنه المطالبة — بغيره تتشابه أربع مطالبات «إعارة
        // لاعب» في إيصالٍ واحد، وهو عين ما قال العميل: «ما يعرف هذا مال مين».
        subject: async ({ entity_type, entity_id }) => {
            if (!entity_id) return null;
            const person = { model: Person, as: "person", attributes: ["first_name", "second_name", "third_name", "tribe"] };
            let player = null;
            if (entity_type === "player") {
                player = await Players.findByPk(entity_id, { include: [person] });
            } else if (entity_type === "transfer" || entity_type === "player_release") {
                const Model = entity_type === "transfer" ? Transfer : PlayerRelease;
                const row = await Model.findByPk(entity_id, {
                    paranoid: false,
                    include: [{ model: Players, as: "player", include: [person] }],
                });
                player = row?.player || null;
            }
            const p = player?.person;
            return [p?.first_name, p?.second_name, p?.third_name, p?.tribe].filter(Boolean).join(" ").trim() || null;
        },
        team: async ({ id_team }) => (id_team ? await Team.findByPk(id_team) : null),
        club: async ({ id_club }) => (id_club ? await Club.findByPk(id_club) : null),
        label: ({ fee_type, label }) => label || feeLabel(fee_type),
    },
};

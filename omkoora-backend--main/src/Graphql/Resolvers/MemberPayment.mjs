import { ApolloError } from 'apollo-server-express';
import logger from "../../Config/logger.mjs";
import { Assembly, Members, Players, Person, MemberPayment, RequestPayment, Team } from '../../Models/index.mjs';
import { callerClubId } from "../../Helpers/clubScope.mjs";
import { buildMemberAccounts } from "../../Helpers/memberAccounts.mjs";

const personName = (p) => [p?.first_name, p?.second_name, p?.third_name, p?.tribe].filter(Boolean).join(" ").trim();

const sumAmount = (payments) => payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

export const resolvers = {
    Query: {
        // «حسابات الأعضاء» في النادي: حسابات أعضاء فرقه كلها، كل شخص مرة واحدة،
        // ومعها رسوم العضوية السنوية المعتمدة على طريق «تسجيل عضو جديد».
        clubMemberAccounts: async (obj, { year }, context) => {
            try {
                const idClub = await callerClubId(context);
                if (!idClub) return { year, rows: [], totalThisYear: 0, members: 0, paidMembers: 0 };
                const theYear = Number(year) || new Date().getFullYear();

                const teams = await Team.findAll({ where: { id_club: idClub }, attributes: ["id", "name"] });
                const teamName = new Map(teams.map((t) => [t.id, t.name]));
                const teamIds = teams.map((t) => t.id);

                const [assembly, ledger, fees] = await Promise.all([
                    Assembly.findAll({ where: { id_club: idClub }, attributes: [
                        "id", "first_name", "second_name", "third_name", "tribe", "card_number",
                        "membership_number", "subscription_date", "status", "id_team"] }),
                    teamIds.length ? MemberPayment.findAll({
                        where: { id_team: teamIds },
                        include: [
                            { model: Members, include: [{ model: Person, as: "person" }] },
                            { model: Players, include: [{ model: Person, as: "person" }] },
                        ],
                    }) : [],
                    RequestPayment.findAll({
                        where: { id_club: idClub, fee_type: "member_registration", entity_type: "assembly", status: "accepted" },
                    }),
                ]);

                const admitted = assembly.filter((a) => !a.status || a.status === "accepted");
                const byAssembly = new Map(assembly.map((a) => [a.id, a]));

                const members = admitted.map((a) => ({
                    id: a.id, name: personName(a), card_number: a.card_number,
                    membership_number: a.membership_number, team: teamName.get(a.id_team) || null,
                    subscription_date: a.subscription_date,
                }));

                const payments = [
                    ...ledger.map((p) => {
                        const holder = p.member || p.player;
                        return {
                            id: p.id, name: personName(holder?.person), card_number: holder?.person?.card_number,
                            team: teamName.get(p.id_team) || null,
                            kind: p.member ? "مجلس إدارة" : p.player ? "لاعب" : null,
                            amount: p.amount, date: p.payment_date || p.createdAt, status: p.status,
                            source: "حساب الفريق", note: p.note,
                        };
                    }),
                    ...fees.map((f) => {
                        const a = byAssembly.get(f.entity_id);
                        return {
                            id: f.id, name: personName(a), card_number: a?.card_number,
                            team: teamName.get(f.id_team || a?.id_team) || null, kind: "عضو",
                            amount: f.amount, date: f.paid_at || f.decided_at || f.updatedAt, status: "paid",
                            source: "رسوم العضوية السنوية", note: f.note,
                        };
                    }),
                ];

                return buildMemberAccounts({ members, payments, year: theYear });
            } catch (error) {
                logger.error(`MemberPayment.clubMemberAccounts: ${error?.message || error}`);
                throw new ApolloError("تعذّر جلب حسابات الأعضاء");
            }
        },

        // Every member of the team, each with the payments they have made and
        // the running total — so the "حسابات الأعضاء" tab can list name, phone
        // and amount paid in one shot.
        memberAccountsTeam: async (obj, { idTeam }, context, info) => {
            if (!idTeam) return []   // team-scoped: no team → no rows (avoids the undefined-where crash)
            try {
                const members = await Members.findAll({
                    where: { id_team: idTeam },
                    include: [{ model: Person, as: "person" }]
                });

                const accounts = await Promise.all(members.map(async (member) => {
                    const payments = await MemberPayment.findAll({
                        where: { id_member: member.id },
                        order: [['createdAt', 'DESC']]
                    });
                    return { member, totalPaid: sumAmount(payments), payments };
                }));

                return accounts;
            } catch (error) {
                logger.error(`MemberPayment.memberAccountsTeam: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        // Same ledger shape but for the team's players.
        playerAccountsTeam: async (obj, { idTeam }, context, info) => {
            if (!idTeam) return []   // team-scoped: no team → no rows (avoids the undefined-where crash)
            try {
                const players = await Players.findAll({
                    where: { id_team: idTeam },
                    include: [{ model: Person, as: "person" }]
                });

                return await Promise.all(players.map(async (player) => {
                    const payments = await MemberPayment.findAll({
                        where: { id_player: player.id },
                        order: [['createdAt', 'DESC']]
                    });
                    return { player, totalPaid: sumAmount(payments), payments };
                }));
            } catch (error) {
                logger.error(`MemberPayment.playerAccountsTeam: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        // A single player's own ledger — the player portal ("مصروفاتي").
        playerPayments: async (obj, { idPlayer }, context, info) => {
            try {
                const player = await Players.findByPk(idPlayer);
                const payments = await MemberPayment.findAll({
                    where: { id_player: idPlayer },
                    order: [['createdAt', 'DESC']]
                });
                return { player, totalPaid: sumAmount(payments), payments };
            } catch (error) {
                logger.error(`MemberPayment.playerPayments: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        }
    },

    Mutation: {
        createMemberPayment: async (obj, { content }, context, info) => {
            try {
                return await MemberPayment.create(content);
            } catch (error) {
                logger.error(`MemberPayment.createMemberPayment: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        deleteMemberPayment: async (obj, { id }, context, info) => {
            try {
                const deleted = await MemberPayment.destroy({ where: { id } });
                return { status: deleted === 1 };
            } catch (error) {
                logger.error(`MemberPayment.deleteMemberPayment: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        }
    }
};

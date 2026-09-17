import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import logger from "../../Config/logger.mjs";
import {
    Club, Team, Players, TechnicalApparatus, ClubManagement,
    Event, Reservations, League, Person, Transfer,
} from '../../Models/index.mjs';

const { Op, fn, col } = sequelize;

const AGE_LABELS = {
    firstDegree: "الفريق الأول",
    secondDegree: "تحت 23 سنة",
    rookies: "تحت 18 سنة",
    young: "تحت 16 سنة",
};

export const resolvers = {
    Query: {
        // Every team with its club name and how many players it has.
        statsTeamsWithPlayerCount: async () => {
            try {
                const teams = await Team.findAll({ include: [{ model: Club, as: "club", attributes: ["id", "name"] }] });
                const counts = await Players.findAll({
                    attributes: ["id_team", [fn("COUNT", col("id")), "cnt"]],
                    group: ["id_team"], raw: true,
                });
                const map = new Map(counts.map((c) => [c.id_team, Number(c.cnt)]));
                return teams.map((t) => ({ team: t, clubName: t.club?.name || null, playersCount: map.get(t.id) || 0 }));
            } catch (error) { logger.error(`statsTeamsWithPlayerCount: ${error?.message}`); throw new ApolloError(error); }
        },

        // Players grouped by age category, with distinct club/team spread.
        statsPlayersByAgeCategory: async () => {
            try {
                const [rows, teams] = await Promise.all([
                    Players.findAll({ attributes: ["class", "id_team"], raw: true }),
                    Team.findAll({ attributes: ["id", "id_club"], raw: true }),
                ]);
                const teamClub = new Map(teams.map((t) => [t.id, t.id_club]));
                const byClass = {};
                for (const r of rows) {
                    const k = r.class || "__none__";
                    (byClass[k] = byClass[k] || { players: 0, teams: new Set(), clubs: new Set() });
                    byClass[k].players++;
                    if (r.id_team) {
                        byClass[k].teams.add(r.id_team);
                        const c = teamClub.get(r.id_team);
                        if (c) byClass[k].clubs.add(c);
                    }
                }
                return Object.entries(byClass).map(([k, v]) => ({
                    ageCategory: k === "__none__" ? null : k,
                    ageLabel: AGE_LABELS[k] || "غير محدد",
                    playersCount: v.players,
                    teamsCount: v.teams.size,
                    clubsCount: v.clubs.size,
                }));
            } catch (error) { logger.error(`statsPlayersByAgeCategory: ${error?.message}`); throw new ApolloError(error); }
        },

        // Transfers/loans each team is party to (as source OR destination).
        statsTransfersByTeam: async () => {
            try {
                const teams = await Team.findAll({ include: [{ model: Club, as: "club", attributes: ["name"] }] });
                const trs = await Transfer.findAll({ attributes: ["id_team_from", "id_team_to", "transition_type"], raw: true });
                const tally = {};
                for (const tr of trs) {
                    for (const tid of [tr.id_team_from, tr.id_team_to]) {
                        if (!tid) continue;
                        tally[tid] = tally[tid] || { t: 0, l: 0 };
                        if (tr.transition_type === "loan") tally[tid].l++;
                        else if (tr.transition_type === "transition") tally[tid].t++;
                    }
                }
                return teams.map((t) => ({
                    team: t,
                    clubName: t.club?.name || null,
                    transfersCount: tally[t.id]?.t || 0,
                    loansCount: tally[t.id]?.l || 0,
                }));
            } catch (error) { logger.error(`statsTransfersByTeam: ${error?.message}`); throw new ApolloError(error); }
        },

        allTechnicalStaff: async () => {
            try { return await TechnicalApparatus.findAll(); }
            catch (error) { logger.error(`allTechnicalStaff: ${error?.message}`); throw new ApolloError(error); }
        },

        allBoardMembers: async () => {
            try { return await ClubManagement.findAll(); }
            catch (error) { logger.error(`allBoardMembers: ${error?.message}`); throw new ApolloError(error); }
        },

        allEventsGlobal: async (obj, { idTeam }) => {
            try { return await Event.findAll({ where: idTeam ? { id_team: idTeam } : {}, order: [["createdAt", "DESC"]] }); }
            catch (error) { logger.error(`allEventsGlobal: ${error?.message}`); throw new ApolloError(error); }
        },

        allBookings: async () => {
            try { return await Reservations.findAll({ order: [["booking_date", "DESC"]] }); }
            catch (error) { logger.error(`allBookings: ${error?.message}`); throw new ApolloError(error); }
        },

        // One search across clubs, teams, players (name/civil ID) and competitions.
        globalSearch: async (obj, { query }) => {
            try {
                const q = `%${("" + (query ?? "")).trim()}%`;
                const [clubs, teams, players, competitions] = await Promise.all([
                    Club.findAll({ where: { name: { [Op.like]: q } }, limit: 20 }),
                    Team.findAll({ where: { name: { [Op.like]: q } }, limit: 20 }),
                    Players.findAll({
                        include: [{
                            model: Person, as: "person", required: true,
                            where: { [Op.or]: [
                                { first_name: { [Op.like]: q } },
                                { second_name: { [Op.like]: q } },
                                { third_name: { [Op.like]: q } },
                                { card_number: { [Op.like]: q } },
                            ] },
                        }],
                        limit: 20,
                    }),
                    League.findAll({ where: { name: { [Op.like]: q } }, limit: 20 }),
                ]);
                return { clubs, teams, players, competitions };
            } catch (error) { logger.error(`globalSearch: ${error?.message}`); throw new ApolloError(error); }
        },
    },
};

import DataLoader from "dataloader";
import sequelize from "sequelize";

import {
    Person,
    Team,
    Club,
    AttachmentPerson,
    Transfer,
    Players,
    TechnicalApparatus,
    Members,
} from "../Models/index.mjs";

const { Op } = sequelize;

// Build a fresh set of DataLoaders for one Apollo request. Each loader
// batches all .load(id) calls in the same tick into a single SQL query
// (`WHERE id IN (...)`) and returns results in the order the ids were
// requested. This collapses the classic GraphQL N+1 — e.g. 100 players
// hitting Player.person individually used to fire 100 SELECTs; with the
// loader it fires one.
//
// Re-create per request so cached rows from one user never bleed into
// another. Wired into Apollo context via context.loaders.

const orderById = (ids, rows) => {
    const byId = new Map(rows.map((r) => [String(r.id), r]));
    return ids.map((id) => byId.get(String(id)) || null);
};

const groupByKey = (keys, rows, keyField) => {
    const buckets = new Map();
    for (const k of keys) buckets.set(String(k), []);
    for (const r of rows) {
        const k = String(r[keyField]);
        if (buckets.has(k)) buckets.get(k).push(r);
    }
    return keys.map((k) => buckets.get(String(k)) || []);
};

export const buildLoaders = () => ({
    person: new DataLoader(async (ids) => {
        const rows = await Person.findAll({ where: { id: { [Op.in]: ids } } });
        return orderById(ids, rows);
    }),

    team: new DataLoader(async (ids) => {
        const rows = await Team.findAll({ where: { id: { [Op.in]: ids } } });
        return orderById(ids, rows);
    }),

    attachmentsByPlayer: new DataLoader(async (playerIds) => {
        const rows = await AttachmentPerson.findAll({
            where: { id_player: { [Op.in]: playerIds } },
        });
        return groupByKey(playerIds, rows, "id_player");
    }),

    transfersByPlayer: new DataLoader(async (playerIds) => {
        const rows = await Transfer.findAll({
            where: { id_player: { [Op.in]: playerIds } },
            order: [["createdAt", "DESC"]],
        });
        return groupByKey(playerIds, rows, "id_player");
    }),

    // Where a person (by civil ID) currently sits in a team: as a player,
    // technical staff or board member. Assembly rows are flat copies of a
    // person with no link back, so this is how their card learns the team.
    // Three queries for the whole list, regardless of its size.
    affiliationsByCardNumber: new DataLoader(async (cardNumbers) => {
        const cards = [...new Set(cardNumbers.map((c) => String(c)))];
        const withPersonAndTeam = {
            include: [
                { model: Person, as: "person", required: true, attributes: ["id", "card_number"], where: { card_number: { [Op.in]: cards } } },
                // Require a *live* team AND a *live* club: a person's record under
                // a soft-deleted (duplicate) club — e.g. an old "النادي الشباب"
                // from 2023 — must not surface as a current affiliation. Both
                // models are paranoid, so requiring the Club join drops teams
                // whose club was deleted.
                { model: Team, as: "team", required: true, include: [{ model: Club, as: "club", required: true, attributes: ["id"] }] },
            ],
        };

        const [players, technicals, members] = await Promise.all([
            Players.findAll(withPersonAndTeam),
            TechnicalApparatus.findAll(withPersonAndTeam),
            Members.findAll(withPersonAndTeam),
        ]);

        const card = (r) => ("" + (r.person.card_number ?? "")).trim();
        const rows = [
            ...players.map((r) => ({ role: "player", status: r.status, position: r.player_center, card: card(r), team: r.team })),
            ...technicals.map((r) => ({ role: "technical", status: r.status, position: r.occupation, card: card(r), team: r.team })),
            ...members.map((r) => ({ role: "member", status: r.status, position: r.occupation, card: card(r), team: r.team })),
        ];
        return groupByKey(cardNumbers, rows, "card");
    }),
});

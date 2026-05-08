import DataLoader from "dataloader";
import sequelize from "sequelize";

import {
    Person,
    Team,
    AttachmentPerson,
    Transfer,
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
});

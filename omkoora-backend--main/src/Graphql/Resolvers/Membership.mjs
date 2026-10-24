import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';

import logger from "../../Config/logger.mjs";
import db from "../../Config/DBContact.mjs";
import { callerClubId } from "../../Helpers/clubScope.mjs";
import { kindLabel, membershipCounts, normalizeMembershipFilters } from "../../Helpers/membership.mjs";

const { QueryTypes } = sequelize;

// The four registers, read as one. Each branch produces the same columns so the
// union stays readable; the assembly branch is the one that carries membership
// numbers and dates, which only it has.
const UNION_SQL = `
    SELECT 'player' AS kind, pl.id AS id, pl.status AS status,
           NULL AS membership_number, NULL AS membership_date,
           CONCAT_WS(' ', p.first_name, p.second_name, p.third_name, p.tribe) AS full_name,
           p.card_number AS card_number, p.phone AS phone, p.personal_picture AS personal_picture,
           t.id AS team_id, t.name AS team_name, pl.createdAt AS createdAt
    FROM players pl
    JOIN people p ON p.id = pl.id_person
    JOIN teams  t ON t.id = pl.id_team AND t.deletedAt IS NULL
    WHERE pl.deletedAt IS NULL AND t.id_club = :club

    UNION ALL

    SELECT 'technical', ta.id, ta.status,
           NULL, NULL,
           CONCAT_WS(' ', p.first_name, p.second_name, p.third_name, p.tribe),
           p.card_number, p.phone, p.personal_picture,
           t.id, t.name, ta.createdAt
    FROM technical_apparatus ta
    JOIN people p ON p.id = ta.id_person
    JOIN teams  t ON t.id = ta.id_team AND t.deletedAt IS NULL
    WHERE ta.deletedAt IS NULL AND t.id_club = :club

    UNION ALL

    SELECT 'board', m.id, m.status,
           NULL, NULL,
           CONCAT_WS(' ', p.first_name, p.second_name, p.third_name, p.tribe),
           p.card_number, p.phone, p.personal_picture,
           t.id, t.name, m.createdAt
    FROM members m
    JOIN people p ON p.id = m.id_person
    JOIN teams  t ON t.id = m.id_team AND t.deletedAt IS NULL
    WHERE m.deletedAt IS NULL AND t.id_club = :club

    UNION ALL

    SELECT 'assembly', a.id, 'accepted',
           a.membership_number, a.membership_date,
           CONCAT_WS(' ', a.first_name, a.second_name, a.third_name, a.tribe),
           a.card_number, a.phone, a.personal_picture,
           t.id, t.name, a.createdAt
    FROM assemblies a
    LEFT JOIN teams t ON t.id = a.id_team AND t.deletedAt IS NULL
    WHERE a.deletedAt IS NULL AND a.id_club = :club
`;

const FILTERS = `
    WHERE (:kind IS NULL OR membership.kind = :kind)
      AND (:status IS NULL OR membership.status = :status)
      AND (:search IS NULL
           OR membership.full_name LIKE :like
           OR membership.card_number LIKE :like
           OR membership.membership_number LIKE :like)
`;

export const resolvers = {
    Query: {
        clubMembership: async (obj, args, context) => {
            try {
                const idClub = await callerClubId(context);
                const filters = normalizeMembershipFilters(args);

                if (!idClub) {
                    return { total: 0, page: filters.page, limit: filters.limit, counts: membershipCounts([]), rows: [] };
                }

                const bind = {
                    club: idClub,
                    kind: filters.kind,
                    status: filters.status,
                    search: filters.search,
                    like: filters.search ? `%${filters.search}%` : null,
                };

                const [rows, totals, counts] = await Promise.all([
                    db.query(
                        `SELECT * FROM (${UNION_SQL}) AS membership ${FILTERS}
                         ORDER BY membership.createdAt DESC
                         LIMIT ${filters.limit} OFFSET ${filters.offset}`,
                        { replacements: bind, type: QueryTypes.SELECT }
                    ),
                    db.query(
                        `SELECT COUNT(*) AS total FROM (${UNION_SQL}) AS membership ${FILTERS}`,
                        { replacements: bind, type: QueryTypes.SELECT }
                    ),
                    // The chips count every classification, ignoring the chosen
                    // one — otherwise picking a filter would hide where else to go.
                    db.query(
                        `SELECT membership.kind AS kind, COUNT(*) AS count
                         FROM (${UNION_SQL}) AS membership
                         WHERE (:status IS NULL OR membership.status = :status)
                           AND (:search IS NULL
                                OR membership.full_name LIKE :like
                                OR membership.card_number LIKE :like
                                OR membership.membership_number LIKE :like)
                         GROUP BY membership.kind`,
                        { replacements: { ...bind, kind: null }, type: QueryTypes.SELECT }
                    ),
                ]);

                return {
                    total: Number(totals?.[0]?.total) || 0,
                    page: filters.page,
                    limit: filters.limit,
                    counts: membershipCounts(counts),
                    rows: rows.map((row) => ({ ...row, label: kindLabel(row.kind) })),
                };
            } catch (error) {
                logger.error(`Membership.clubMembership: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },
};

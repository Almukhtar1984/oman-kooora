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
           COALESCE(NULLIF(TRIM(p.card_number), ''), CONCAT('player:', pl.id)) AS identity,
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
           COALESCE(NULLIF(TRIM(p.card_number), ''), CONCAT('technical:', ta.id)),
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
           COALESCE(NULLIF(TRIM(p.card_number), ''), CONCAT('board:', m.id)),
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
           COALESCE(NULLIF(TRIM(a.card_number), ''), CONCAT('assembly:', a.id)),
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

                // One row per person, not per record: a player who is also an
                // assembly member is one member of this club carrying two
                // classifications, and the owner was explicit — «بس ما يكون
                // متكرر». The civil number is the identity; a row without one
                // stands alone rather than merging with a stranger.
                const GROUPED = `
                    SELECT membership.identity AS identity,
                           MAX(membership.id) AS id,
                           GROUP_CONCAT(DISTINCT membership.kind ORDER BY membership.kind SEPARATOR ',') AS kinds,
                           GROUP_CONCAT(DISTINCT membership.status ORDER BY membership.status SEPARATOR ',') AS statuses,
                           MAX(membership.full_name) AS full_name,
                           MAX(membership.card_number) AS card_number,
                           MAX(membership.phone) AS phone,
                           MAX(membership.personal_picture) AS personal_picture,
                           MAX(membership.membership_number) AS membership_number,
                           MAX(membership.membership_date) AS membership_date,
                           MAX(membership.team_id) AS team_id,
                           MAX(membership.team_name) AS team_name,
                           MIN(membership.createdAt) AS createdAt
                    FROM (${UNION_SQL}) AS membership
                    ${FILTERS}
                    GROUP BY membership.identity
                `;

                const [rows, totals, counts] = await Promise.all([
                    db.query(
                        `${GROUPED} ORDER BY createdAt DESC LIMIT ${filters.limit} OFFSET ${filters.offset}`,
                        { replacements: bind, type: QueryTypes.SELECT }
                    ),
                    db.query(
                        `SELECT COUNT(DISTINCT membership.identity) AS total
                         FROM (${UNION_SQL}) AS membership ${FILTERS}`,
                        { replacements: bind, type: QueryTypes.SELECT }
                    ),
                    // The chips count people per classification and ignore the
                    // chosen one — otherwise picking a filter would hide where
                    // else this club's people are.
                    db.query(
                        `SELECT membership.kind AS kind, COUNT(DISTINCT membership.identity) AS count
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
                    rows: rows.map((row) => {
                        const kinds = String(row.kinds || "").split(",").filter(Boolean);
                        const statuses = String(row.statuses || "").split(",").filter(Boolean);
                        return {
                            ...row,
                            kind: kinds[0] || null,
                            // «لاعب · عضو أساسي» — the person, and everything they are.
                            label: kinds.map(kindLabel).filter(Boolean).join(" · "),
                            // Pending anywhere means the club still has work on them.
                            status: statuses.includes("waiting") || statuses.includes("waiting_club")
                                ? "waiting"
                                : (statuses[0] || null),
                        };
                    }),
                };
            } catch (error) {
                logger.error(`Membership.clubMembership: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },
};

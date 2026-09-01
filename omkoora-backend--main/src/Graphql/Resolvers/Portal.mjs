import { ApolloError, AuthenticationError } from 'apollo-server-express';
import sequelize from 'sequelize';

import logger from "../../Config/logger.mjs";
import { AuthToken } from "../../Helpers/index.mjs";
import {
    cardNumberLookupValues,
    normalizeCardNumber,
    normalizePhone,
} from "../../Helpers/PortalIdentity.mjs";
import {
    Assembly, Club, MemberPayment, Members, Person, Players, Team, TechnicalApparatus,
} from '../../Models/index.mjs';

const { Op } = sequelize;

// Phone + civil ID are not secrets, so throttle guessing: a handful of attempts
// per civil ID and per client, then a cool-down. In-memory on purpose — the API
// runs as a single process, and a restart clearing the counters is acceptable
// for this. See ATTEMPT_LIMIT/WINDOW_MS below for the actual budget.
const ATTEMPT_LIMIT = 8;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map();

const tooManyAttempts = (key) => {
    const now = Date.now();
    const entry = attempts.get(key);

    if (!entry || now - entry.first > WINDOW_MS) {
        attempts.set(key, { count: 1, first: now });
        return false;
    }

    entry.count += 1;
    return entry.count > ATTEMPT_LIMIT;
};

const clearAttempts = (key) => attempts.delete(key);

// Keep the map from growing without bound on a long-running process.
const pruneAttempts = () => {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [key, entry] of attempts) {
        if (entry.first < cutoff) attempts.delete(key);
    }
};

const requirePortalPerson = (context) => {
    if (!context?.portalPerson) {
        throw new AuthenticationError("You must be signed in to the member portal");
    }
    return context.portalPerson;
};

// Find the single person whose civil ID and phone both match. Returns null when
// nothing matches, and "AMBIGUOUS" when the same pair sits on more than one row
// (production has ~89 such pairs) — signing someone into an arbitrary one of
// those would show them another person's record.
const findPersonByCredentials = async (rawPhone, rawCard) => {
    const phone = normalizePhone(rawPhone);
    const card = normalizeCardNumber(rawCard);

    if (!phone || !card) return null;

    // Indexed lookup first: try the spellings of the civil ID we can name.
    let candidates = await Person.findAll({
        where: { card_number: { [Op.in]: cardNumberLookupValues(rawCard) } },
    });

    // Only if that misses do we pay for a scan that normalises the column, which
    // catches the rows stored with stray separators.
    if (candidates.length === 0) {
        candidates = await Person.findAll({
            where: sequelize.where(
                sequelize.fn(
                    'REPLACE',
                    sequelize.fn('REPLACE',
                        sequelize.fn('REPLACE', sequelize.col('card_number'), ' ', ''),
                        '-', ''),
                    '/', ''
                ),
                card
            ),
        });
    }

    const matches = candidates.filter((person) => normalizePhone(person.phone) === phone);

    if (matches.length === 0) return null;
    if (matches.length > 1) return "AMBIGUOUS";
    return matches[0];
};

// Everything the person is registered as. A portal account is only granted to
// someone who actually appears somewhere — a bare `people` row is not enough.
const loadMemberships = async (idPerson) => {
    const [players, members, technicals] = await Promise.all([
        Players.findAll({ where: { id_person: idPerson } }),
        Members.findAll({ where: { id_person: idPerson } }),
        TechnicalApparatus.findAll({ where: { id_person: idPerson } }),
    ]);

    return [
        ...players.map((row) => ({
            kind: "player",
            id: row.id,
            status: row.status,
            class: row.class,
            occupation: row.job,
            classification: row.activity,
            membership_date: null,
            id_team: row.id_team,
        })),
        ...members.map((row) => ({
            kind: "member",
            id: row.id,
            status: row.status,
            class: null,
            occupation: row.occupation,
            classification: row.classification,
            membership_date: row.membership_date,
            id_team: row.id_team,
        })),
        ...technicals.map((row) => ({
            kind: "technical",
            id: row.id,
            status: row.status,
            class: null,
            occupation: row.occupation,
            classification: row.classification,
            membership_date: row.membership_date,
            id_team: row.id_team,
        })),
    ];
};

export const resolvers = {
    Query: {
        portalMe: async (obj, args, context, info) => {
            try {
                const person = requirePortalPerson(context);

                const memberships = await loadMemberships(person.id);

                // The assembly keeps its own copy of the person's details rather
                // than pointing at `people`, so it is matched by civil ID.
                const card = normalizeCardNumber(person.card_number);
                const assemblies = card
                    ? await Assembly.findAll({
                        where: { card_number: { [Op.in]: cardNumberLookupValues(person.card_number) } },
                    })
                    : [];

                return { person, memberships, assemblies };
            } catch (error) {
                if (error instanceof AuthenticationError) throw error;
                logger.error(`portalMe error: ${error.message || error}`);
                throw new ApolloError(error);
            }
        },

        portalPayments: async (obj, args, context, info) => {
            try {
                const person = requirePortalPerson(context);

                const memberships = await loadMemberships(person.id);
                const playerIds = memberships.filter((m) => m.kind === "player").map((m) => m.id);
                const memberIds = memberships.filter((m) => m.kind === "member").map((m) => m.id);

                if (playerIds.length === 0 && memberIds.length === 0) {
                    return { totalPaid: 0, payments: [] };
                }

                const where = [];
                if (playerIds.length) where.push({ id_player: { [Op.in]: playerIds } });
                if (memberIds.length) where.push({ id_member: { [Op.in]: memberIds } });

                const payments = await MemberPayment.findAll({
                    where: { [Op.or]: where },
                    order: [['payment_date', 'DESC'], ['createdAt', 'DESC']],
                });

                const totalPaid = payments.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

                return { totalPaid, payments };
            } catch (error) {
                if (error instanceof AuthenticationError) throw error;
                logger.error(`portalPayments error: ${error.message || error}`);
                throw new ApolloError(error);
            }
        },
    },

    PortalMembership: {
        team: async ({ id_team }, args, context, info) => {
            if (!id_team) return null;
            try {
                return await Team.findByPk(id_team);
            } catch (error) {
                logger.error(`PortalMembership.team error: ${error.message || error}`);
                throw new ApolloError(error);
            }
        },

        club: async ({ id_team }, args, context, info) => {
            if (!id_team) return null;
            try {
                const team = await Team.findByPk(id_team);
                if (!team?.id_club) return null;
                return await Club.findByPk(team.id_club);
            } catch (error) {
                logger.error(`PortalMembership.club error: ${error.message || error}`);
                throw new ApolloError(error);
            }
        },
    },

    PortalPayment: {
        team: async ({ id_team }, args, context, info) => {
            if (!id_team) return null;
            try {
                return await Team.findByPk(id_team);
            } catch (error) {
                logger.error(`PortalPayment.team error: ${error.message || error}`);
                throw new ApolloError(error);
            }
        },

        paid_as: ({ id_player, id_member }) => (id_player ? "player" : id_member ? "member" : null),
    },

    Mutation: {
        authenticatePortalPerson: async (obj, { phone, card_number }, context, info) => {
            try {
                pruneAttempts();

                const card = normalizeCardNumber(card_number);
                const throttleKey = `${card}|${context?.req?.ip || "unknown"}`;

                if (!card || !normalizePhone(phone)) {
                    return new ApolloError("Phone and civil ID are required", "PORTAL_MISSING_FIELDS");
                }

                if (tooManyAttempts(throttleKey)) {
                    return new ApolloError("Too many attempts", "PORTAL_TOO_MANY_ATTEMPTS");
                }

                const person = await findPersonByCredentials(phone, card_number);

                if (person === "AMBIGUOUS") {
                    return new ApolloError("Duplicate records for these details", "PORTAL_AMBIGUOUS");
                }

                if (!person) {
                    return new ApolloError("No matching member", "PORTAL_NOT_FOUND");
                }

                const memberships = await loadMemberships(person.id);
                if (memberships.length === 0) {
                    return new ApolloError("Person is not registered with a club", "PORTAL_NOT_REGISTERED");
                }

                clearAttempts(throttleKey);

                // `kind: "portal"` keeps this token out of AuthMiddleware's user
                // path: it identifies a person, not a dashboard account, and must
                // not satisfy @auth(requires: user) anywhere else in the schema.
                const token = await AuthToken(
                    { kind: "portal", id_person: person.id },
                    undefined,
                    context.appKey
                );

                return { token, person };
            } catch (error) {
                logger.error(`authenticatePortalPerson error: ${error.message || error}`);
                throw new ApolloError(error);
            }
        },
    },
};

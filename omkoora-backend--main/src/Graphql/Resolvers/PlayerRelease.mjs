import { ApolloError } from 'apollo-server-express';
import { createWriteStream } from "fs";
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";
import { __dirname } from "../../app.mjs";
import { Club, Players, PlayerRelease, Team } from '../../Models/index.mjs';
import { callerClubId, clubOfTeam } from "../../Helpers/clubScope.mjs";
import {
    RELEASE_WAITING, RELEASE_ACCEPTED, canRequestRelease, releaseDecision,
} from "../../Helpers/playerRelease.mjs";
import { CreateNotificationClub, CreateNotificationTeam } from "../../Helpers/index.mjs";

const SUPER_ADMIN_ROLE = "1";
const CLUB_ADMIN_ROLE = "2";

const LETTER_TYPES = ["JPEG", "JPG", "PNG", "PDF", "DOC", "DOCX"];

// Store the resignation letter and return the filename to keep on the row.
const storeLetter = async (upload) => {
    const { createReadStream, filename } = await upload;
    const parts = String(filename || "").split(".");
    const type = parts[parts.length - 1].toUpperCase();

    if (!LETTER_TYPES.includes(type)) {
        throw new ApolloError("صيغة خطاب الاستقالة غير مدعومة (PDF أو صورة أو Word)", "LETTER_TYPE_UNSUPPORTED");
    }

    const uniqueName = `${UUID()}.${type}`;
    const target = path.join(__dirname, `./../uploads/${uniqueName}`);
    await createReadStream().pipe(createWriteStream(target));
    return uniqueName;
};

export const resolvers = {
    Query: {
        allPlayerReleases: async (obj, { idClub, idTeam, status }, context) => {
            try {
                const where = {};
                // A club sees its own requests whatever it asks for; nobody reads
                // another club's resignations.
                const mine = await callerClubId(context);
                if (mine) where.id_club = mine;
                else if (idClub) where.id_club = idClub;

                if (idTeam) where.id_team = idTeam;
                if (status) where.status = status;

                return await PlayerRelease.findAll({ where, order: [["createdAt", "DESC"]] });
            } catch (error) {
                logger.error(`PlayerRelease.allPlayerReleases: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        playerRelease: async (obj, { id }, context) => {
            try {
                const row = await PlayerRelease.findByPk(id);
                if (!row) return null;

                const mine = await callerClubId(context);
                if (mine && row.id_club !== mine) {
                    throw new ApolloError("هذا الطلب لا يخصّ ناديك", "FORBIDDEN_RELEASE");
                }
                return row;
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error(`PlayerRelease.playerRelease: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },

    Mutation: {
        createPlayerRelease: async (obj, { content }, context) => {
            try {
                const player = await Players.findByPk(content.id_player);

                // Only the club the player actually plays for may start this.
                const idClub = await clubOfTeam(player?.id_team);
                const mine = await callerClubId(context);
                if (player && mine && idClub && mine !== idClub) {
                    throw new ApolloError("هذا اللاعب لا يتبع ناديك", "FORBIDDEN_PLAYER");
                }

                const open = player
                    ? await PlayerRelease.findOne({
                        where: { id_player: player.id, status: RELEASE_WAITING },
                    })
                    : null;

                const verdict = canRequestRelease(player, open);
                if (!verdict.ok) throw new ApolloError(verdict.message, verdict.code);

                const letter = content.letter ? await storeLetter(content.letter) : null;

                const release = await PlayerRelease.create({
                    id_player: player.id,
                    id_team: player.id_team,
                    id_club: idClub,
                    reason: content.reason || null,
                    letter,
                    status: RELEASE_WAITING,
                    requested_at: new Date(),
                    id_requested_by: context?.user?.id || null,
                });

                // The club decides, so the club is the one told about it.
                if (idClub) {
                    void CreateNotificationClub("player", "create", idClub, "", player.id);
                }

                return release;
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error(`PlayerRelease.createPlayerRelease: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },

        decidePlayerRelease: async (obj, { id, status, note }, context) => {
            try {
                const release = await PlayerRelease.findByPk(id);
                if (!release) throw new ApolloError("الطلب غير موجود", "RELEASE_NOT_FOUND");

                // The owner's rule: the player's own club decides, alone.
                const role = context?.user?.role;
                const mine = await callerClubId(context);
                const isOwningClub = role === CLUB_ADMIN_ROLE && mine && mine === release.id_club;
                if (!isOwningClub && role !== SUPER_ADMIN_ROLE) {
                    throw new ApolloError(
                        "اعتماد إخلاء الطرف من صلاحية النادي صاحب اللاعب",
                        "FORBIDDEN_RELEASE_DECISION"
                    );
                }

                const decision = releaseDecision(release.status, status);
                if (!decision.valid) {
                    throw new ApolloError(
                        release.status === RELEASE_WAITING
                            ? "قرار غير مفهوم — اعتماد أو رفض"
                            : "هذا الطلب تمّ البتّ فيه مسبقاً",
                        "RELEASE_DECISION_INVALID"
                    );
                }

                await release.update({
                    status: decision.status,
                    note: note || null,
                    decided_at: new Date(),
                    id_decided_by: context?.user?.id || null,
                });

                if (decision.frees) {
                    // The whole point: he leaves the team and becomes registrable
                    // elsewhere. His record, and this one, keep where he came from.
                    await Players.update({ id_team: null }, { where: { id: release.id_player } });
                }

                if (release.id_team) {
                    void CreateNotificationTeam("player", decision.frees ? "accepted" : "rejected",
                        release.id_team, release.id_player, "player");
                }

                return { status: true };
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error(`PlayerRelease.decidePlayerRelease: ${error?.message || error}`);
                throw new ApolloError(error);
            }
        },
    },

    PlayerRelease: {
        player: async ({ id_player }) => (id_player ? await Players.findByPk(id_player) : null),
        team: async ({ id_team }) => (id_team ? await Team.findByPk(id_team) : null),
        club: async ({ id_club }) => (id_club ? await Club.findByPk(id_club) : null),
    },
};

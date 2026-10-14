import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';

import logger from "../../Config/logger.mjs";
import {
    Academy, AcademyProgram, AcademyNews, AcademyRegistration, User, Permission, Notification,
} from '../../Models/index.mjs';
import { hashPassword } from "../../Helpers/index.mjs";
import { saveUpload } from "../../Helpers/Upload.mjs";
import { sendPushToUser } from "../../Config/firebase.mjs";

const { Op } = sequelize;

const ACADEMY_OWNER_ROLE = "7";
const SUPER_ADMIN_ROLE = "1";
const FULL_GRANT = "1,2,3,4,5,6,7,8,9,10";

const IMAGE_TYPES = ["JPEG", "JPG", "PNG"];

// Preserve an intentional coded error (FORBIDDEN / NOT_FOUND / AUTH_REQUIRED)
// through a catch instead of flattening it to INTERNAL_SERVER_ERROR (which the
// production formatError then masks). Unknown errors still wrap as before.
const wrap = (error) => (error?.extensions?.code ? error : new ApolloError(error));

// The signed-in user, or null when the request is not authenticated.
const authUser = (context) => (context?.isAuth && context?.user) ? context.user : null;

// IDs of every academy the signed-in owner owns. Empty array when not signed in
// or the owner has none — callers then return [] without ever building an
// `undefined` WHERE (which would crash / leak rows).
const myAcademyIds = async (context) => {
    const user = authUser(context);
    if (!user) return [];
    const rows = await Academy.findAll({ where: { id_user: user.id }, attributes: ["id"], raw: true });
    return rows.map((r) => r.id);
};

// Guard: the academy must exist and belong to the caller. Returns the academy
// or throws FORBIDDEN/NOT_FOUND — so an owner can only touch their own units.
const requireOwnedAcademy = async (context, idAcademy) => {
    const user = authUser(context);
    if (!user) throw new ApolloError("Authentication required", "AUTH_REQUIRED");
    const academy = await Academy.findByPk(idAcademy);
    if (!academy) throw new ApolloError("الأكاديمية غير موجودة", "ACADEMY_NOT_FOUND");
    if (academy.id_user !== user.id) throw new ApolloError("غير مصرّح", "FORBIDDEN");
    return academy;
};

export const resolvers = {
    Query: {
        // ---- Public ----
        academies: async () => {
            try {
                return await Academy.findAll({ order: [["createdAt", "DESC"]] });
            } catch (error) {
                logger.error(`academies: ${error?.message}`);
                throw wrap(error);
            }
        },
        academy: async (obj, { id }) => {
            try {
                return id ? await Academy.findByPk(id) : null;
            } catch (error) {
                logger.error(`academy: ${error?.message}`);
                throw wrap(error);
            }
        },
        academyPrograms: async (obj, { idAcademy }) => {
            if (!idAcademy) return [];
            try {
                return await AcademyProgram.findAll({ where: { id_academy: idAcademy }, order: [["createdAt", "DESC"]] });
            } catch (error) {
                logger.error(`academyPrograms: ${error?.message}`);
                throw wrap(error);
            }
        },
        academyNews: async (obj, { idAcademy }) => {
            if (!idAcademy) return [];
            try {
                return await AcademyNews.findAll({ where: { id_academy: idAcademy }, order: [["createdAt", "DESC"]] });
            } catch (error) {
                logger.error(`academyNews: ${error?.message}`);
                throw wrap(error);
            }
        },
        allAcademyNews: async () => {
            try {
                return await AcademyNews.findAll({ order: [["createdAt", "DESC"]], limit: 100 });
            } catch (error) {
                logger.error(`allAcademyNews: ${error?.message}`);
                throw wrap(error);
            }
        },

        // ---- Owner dashboard ----
        myAcademies: async (obj, {}, context) => {
            try {
                const user = authUser(context);
                if (!user) return [];
                return await Academy.findAll({ where: { id_user: user.id }, order: [["createdAt", "DESC"]] });
            } catch (error) {
                logger.error(`myAcademies: ${error?.message}`);
                throw wrap(error);
            }
        },
        myAcademyPrograms: async (obj, {}, context) => {
            try {
                const ids = await myAcademyIds(context);
                if (ids.length === 0) return [];
                return await AcademyProgram.findAll({ where: { id_academy: { [Op.in]: ids } }, order: [["createdAt", "DESC"]] });
            } catch (error) {
                logger.error(`myAcademyPrograms: ${error?.message}`);
                throw wrap(error);
            }
        },
        myAcademyNews: async (obj, {}, context) => {
            try {
                const ids = await myAcademyIds(context);
                if (ids.length === 0) return [];
                return await AcademyNews.findAll({ where: { id_academy: { [Op.in]: ids } }, order: [["createdAt", "DESC"]] });
            } catch (error) {
                logger.error(`myAcademyNews: ${error?.message}`);
                throw wrap(error);
            }
        },
        myAcademyRegistrations: async (obj, { status }, context) => {
            try {
                const ids = await myAcademyIds(context);
                if (ids.length === 0) return [];
                const where = { id_academy: { [Op.in]: ids } };
                if (status) where.status = status;
                return await AcademyRegistration.findAll({ where, order: [["createdAt", "DESC"]] });
            } catch (error) {
                logger.error(`myAcademyRegistrations: ${error?.message}`);
                throw wrap(error);
            }
        },
        myAcademyReport: async (obj, {}, context) => {
            try {
                const ids = await myAcademyIds(context);
                if (ids.length === 0) return [];
                const programs = await AcademyProgram.findAll({ where: { id_academy: { [Op.in]: ids } }, raw: true });
                const registrations = await AcademyRegistration.findAll({
                    where: { id_academy: { [Op.in]: ids } },
                    attributes: ["id_program", "status"],
                    raw: true,
                });
                // One report row per program; plus an "unassigned" bucket for
                // registrations that target the academy without a program.
                const buckets = new Map();
                const ensure = (id_program, program_name) => {
                    const key = id_program || "__none__";
                    if (!buckets.has(key)) {
                        buckets.set(key, { id_program: id_program || null, program_name, total: 0, waiting: 0, accepted: 0, rejected: 0 });
                    }
                    return buckets.get(key);
                };
                for (const p of programs) ensure(p.id, p.name);
                for (const r of registrations) {
                    const row = ensure(r.id_program, r.id_program ? "" : "بدون برنامج");
                    row.total += 1;
                    if (r.status === "accepted") row.accepted += 1;
                    else if (r.status === "rejected") row.rejected += 1;
                    else row.waiting += 1;
                }
                return [...buckets.values()];
            } catch (error) {
                logger.error(`myAcademyReport: ${error?.message}`);
                throw wrap(error);
            }
        },
    },

    Academy: {
        owner: async ({ id_user }) => {
            try {
                return id_user ? await User.findByPk(id_user) : null;
            } catch (error) {
                logger.error(`Academy.owner: ${error?.message}`);
                return null;
            }
        },
        programs: async ({ id }) => {
            try {
                return id ? await AcademyProgram.findAll({ where: { id_academy: id }, order: [["createdAt", "DESC"]] }) : [];
            } catch (error) {
                logger.error(`Academy.programs: ${error?.message}`);
                return [];
            }
        },
        news: async ({ id }) => {
            try {
                return id ? await AcademyNews.findAll({ where: { id_academy: id }, order: [["createdAt", "DESC"]] }) : [];
            } catch (error) {
                logger.error(`Academy.news: ${error?.message}`);
                return [];
            }
        },
    },

    AcademyProgram: {
        academy: async ({ id_academy }) => (id_academy ? await Academy.findByPk(id_academy) : null),
    },

    AcademyNews: {
        academy: async ({ id_academy }) => (id_academy ? await Academy.findByPk(id_academy) : null),
    },

    AcademyRegistration: {
        academy: async ({ id_academy }) => (id_academy ? await Academy.findByPk(id_academy) : null),
        program: async ({ id_program }) => (id_program ? await AcademyProgram.findByPk(id_program) : null),
    },

    Mutation: {
        // Super-admin provisions an academy-owner login (role 7). If the email
        // already belongs to a role-7 account, its password is reset instead.
        provisionAcademyOwner: async (obj, { email, password }, context) => {
            try {
                const caller = authUser(context);
                if (!caller) return new ApolloError("Authentication required", "AUTH_REQUIRED");
                if (caller.role !== SUPER_ADMIN_ROLE) {
                    return new ApolloError("غير مصرّح: السوبر أدمن فقط", "FORBIDDEN");
                }
                const normalizedEmail = String(email || "").trim().toLowerCase();
                if (!normalizedEmail) return new ApolloError("البريد مطلوب", "EMAIL_REQUIRED");
                if (!password || password.length < 6) return new ApolloError("كلمة المرور قصيرة جدًا", "PASSWORD_TOO_SHORT");

                const existing = await User.findOne({ where: { email: normalizedEmail } });
                if (existing) {
                    if (existing.role !== ACADEMY_OWNER_ROLE) {
                        return new ApolloError("البريد مستخدم لحساب آخر", "EMAIL_TAKEN");
                    }
                    existing.password = await hashPassword(password);
                    existing.activation = true;
                    existing.email_verify = true;
                    await existing.save();
                    return existing;
                }

                const user = await User.create({
                    email: normalizedEmail,
                    password: await hashPassword(password),
                    role: ACADEMY_OWNER_ROLE,
                    activation: true,
                    email_verify: true,
                });
                // Seed a full permission row so the owner dashboard renders.
                await Permission.create({ id_user: user.id, teams: FULL_GRANT });
                return user;
            } catch (error) {
                logger.error(`provisionAcademyOwner: ${error?.message}`);
                throw wrap(error);
            }
        },

        createAcademy: async (obj, { content }, context) => {
            try {
                const caller = authUser(context);
                if (!caller) return new ApolloError("Authentication required", "AUTH_REQUIRED");

                const logo = await content.logo;
                const images = await content.images;
                delete content.logo;
                delete content.images;

                // Owner creates for themselves; super-admin may assign via id_user.
                const id_user = caller.role === SUPER_ADMIN_ROLE
                    ? (content.id_user || caller.id)
                    : caller.id;
                delete content.id_user;

                const logoName = logo ? await saveUpload(logo, { allowed: IMAGE_TYPES }) : null;
                const imageNames = [];
                if (Array.isArray(images) && images.length > 0) {
                    for (const img of images) {
                        imageNames.push(await saveUpload(img, { allowed: IMAGE_TYPES }));
                    }
                }

                return await Academy.create({
                    ...content,
                    id_user,
                    logo: logoName,
                    images: imageNames.length ? imageNames.join(",") : null,
                });
            } catch (error) {
                logger.error(`createAcademy: ${error?.message}`);
                throw wrap(error);
            }
        },

        updateAcademy: async (obj, { id, content }, context) => {
            try {
                await requireOwnedAcademy(context, id);

                const logo = await content.logo;
                const images = await content.images;
                delete content.logo;
                delete content.images;
                // id_user is not reassignable through a normal update.
                delete content.id_user;

                if (logo) content.logo = await saveUpload(logo, { allowed: IMAGE_TYPES });
                if (Array.isArray(images) && images.length > 0) {
                    const imageNames = [];
                    for (const img of images) {
                        imageNames.push(await saveUpload(img, { allowed: IMAGE_TYPES }));
                    }
                    content.images = imageNames.join(",");
                }

                const result = await Academy.update({ ...content }, { where: { id } });
                return { status: result[0] === 1 };
            } catch (error) {
                logger.error(`updateAcademy: ${error?.message}`);
                throw wrap(error);
            }
        },

        deleteAcademy: async (obj, { id }, context) => {
            try {
                await requireOwnedAcademy(context, id);
                const result = await Academy.destroy({ where: { id } });
                return { status: result === 1 };
            } catch (error) {
                logger.error(`deleteAcademy: ${error?.message}`);
                throw wrap(error);
            }
        },

        createAcademyProgram: async (obj, { content }, context) => {
            try {
                await requireOwnedAcademy(context, content.id_academy);
                return await AcademyProgram.create({ ...content });
            } catch (error) {
                logger.error(`createAcademyProgram: ${error?.message}`);
                throw wrap(error);
            }
        },

        updateAcademyProgram: async (obj, { id, content }, context) => {
            try {
                const program = await AcademyProgram.findByPk(id);
                if (!program) return new ApolloError("البرنامج غير موجود", "PROGRAM_NOT_FOUND");
                await requireOwnedAcademy(context, program.id_academy);
                // Do not let an update move the program to another academy.
                delete content.id_academy;
                const result = await AcademyProgram.update({ ...content }, { where: { id } });
                return { status: result[0] === 1 };
            } catch (error) {
                logger.error(`updateAcademyProgram: ${error?.message}`);
                throw wrap(error);
            }
        },

        deleteAcademyProgram: async (obj, { id }, context) => {
            try {
                const program = await AcademyProgram.findByPk(id);
                if (!program) return { status: false };
                await requireOwnedAcademy(context, program.id_academy);
                const result = await AcademyProgram.destroy({ where: { id } });
                return { status: result === 1 };
            } catch (error) {
                logger.error(`deleteAcademyProgram: ${error?.message}`);
                throw wrap(error);
            }
        },

        createAcademyNews: async (obj, { content }, context) => {
            try {
                await requireOwnedAcademy(context, content.id_academy);
                const image = await content.image;
                delete content.image;
                const imageName = image ? await saveUpload(image, { allowed: IMAGE_TYPES }) : null;
                return await AcademyNews.create({ ...content, image: imageName });
            } catch (error) {
                logger.error(`createAcademyNews: ${error?.message}`);
                throw wrap(error);
            }
        },

        updateAcademyNews: async (obj, { id, content }, context) => {
            try {
                const news = await AcademyNews.findByPk(id);
                if (!news) return new ApolloError("الخبر غير موجود", "NEWS_NOT_FOUND");
                await requireOwnedAcademy(context, news.id_academy);
                const image = await content.image;
                delete content.image;
                delete content.id_academy;
                if (image) content.image = await saveUpload(image, { allowed: IMAGE_TYPES });
                const result = await AcademyNews.update({ ...content }, { where: { id } });
                return { status: result[0] === 1 };
            } catch (error) {
                logger.error(`updateAcademyNews: ${error?.message}`);
                throw wrap(error);
            }
        },

        deleteAcademyNews: async (obj, { id }, context) => {
            try {
                const news = await AcademyNews.findByPk(id);
                if (!news) return { status: false };
                await requireOwnedAcademy(context, news.id_academy);
                const result = await AcademyNews.destroy({ where: { id } });
                return { status: result === 1 };
            } catch (error) {
                logger.error(`deleteAcademyNews: ${error?.message}`);
                throw wrap(error);
            }
        },

        updateAcademyRegistrationStatus: async (obj, { id, status }, context) => {
            try {
                const reg = await AcademyRegistration.findByPk(id);
                if (!reg) return new ApolloError("التسجيل غير موجود", "REGISTRATION_NOT_FOUND");
                await requireOwnedAcademy(context, reg.id_academy);
                const result = await AcademyRegistration.update({ status }, { where: { id } });
                return { status: result[0] === 1 };
            } catch (error) {
                logger.error(`updateAcademyRegistrationStatus: ${error?.message}`);
                throw wrap(error);
            }
        },

        updateAcademyRegistrationPayment: async (obj, { id, payment_status, note }, context) => {
            try {
                const reg = await AcademyRegistration.findByPk(id);
                if (!reg) return new ApolloError("التسجيل غير موجود", "REGISTRATION_NOT_FOUND");
                await requireOwnedAcademy(context, reg.id_academy);
                const patch = { payment_status };
                if (note !== undefined) patch.note = note;
                const result = await AcademyRegistration.update(patch, { where: { id } });
                return { status: result[0] === 1 };
            } catch (error) {
                logger.error(`updateAcademyRegistrationPayment: ${error?.message}`);
                throw wrap(error);
            }
        },

        // Public: a parent registers a child from the mobile app. On success the
        // academy's owner gets a user-targeted notification + best-effort push.
        createAcademyRegistration: async (obj, { content }) => {
            try {
                if (!content?.id_academy) return new ApolloError("الأكاديمية مطلوبة", "ACADEMY_REQUIRED");
                const academy = await Academy.findByPk(content.id_academy, { attributes: ["id", "name", "id_user"] });
                if (!academy) return new ApolloError("الأكاديمية غير موجودة", "ACADEMY_NOT_FOUND");

                const registration = await AcademyRegistration.create({ ...content });

                try {
                    if (academy.id_user) {
                        const who = content.full_name || content.phone || "ولي أمر";
                        let programName = "";
                        if (content.id_program) {
                            const program = await AcademyProgram.findByPk(content.id_program, { attributes: ["name"] });
                            programName = program?.name ? ` (${program.name})` : "";
                        }
                        const body = `تسجيل جديد في أكاديمية ${academy.name || ""}${programName} من ${who}`;
                        await Notification.create({ body, id_user: academy.id_user });
                        sendPushToUser(academy.id_user, { title: "تسجيل جديد", body }).catch(() => {});
                    }
                } catch (notifyErr) {
                    logger.error(`createAcademyRegistration notify: ${notifyErr?.message}`);
                }

                return registration;
            } catch (error) {
                logger.error(`createAcademyRegistration: ${error?.message}`);
                throw wrap(error);
            }
        },
    },
};

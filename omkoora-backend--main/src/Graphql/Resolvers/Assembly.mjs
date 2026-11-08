import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";

import {Club, Members, Person, Assembly, User, Team, Players, TechnicalApparatus,} from '../../Models/index.mjs';
import {createWriteStream} from "fs";
import {__dirname} from "../../app.mjs";
import { callerTeamId } from "../../Helpers/clubScope.mjs";
import { openFlow } from "../../Helpers/requestFlowRunner.mjs";
import { CreateDirectNotification } from "../../Helpers/index.mjs";
import { normalizeCardNumber, registrationProblem } from "../../Helpers/memberRegistration.mjs";

const IMAGE_TYPES = ["JPEG", "JPG", "PNG"];

/** يحفظ صورةً مرفوعة ويعيد اسمها — أو يرمي حين لا تكون صورة. */
const saveImage = async (upload) => {
    if (!upload) return null;
    const { createReadStream, filename } = await upload;
    const ext = String(filename || "").split(".").pop().toUpperCase();
    if (!IMAGE_TYPES.includes(ext)) {
        const error = new Error("الملف المرفوع ليس صورة (JPG أو PNG)");
        error.code = "NOT_AN_IMAGE";
        throw error;
    }
    const name = `${UUID()}.${ext}`;
    await createReadStream().pipe(createWriteStream(path.join(__dirname, `./../uploads/${name}`)));
    return name;
};


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        assembly: async (obj, {id}, context, info) =>  {
            try {
                return await Assembly.findByPk(id)
            } catch (error) {
                logger.error(`Assembly.assembly: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        allAssemblyClub: async (obj, {idClub}, context, info) =>  {
            try {
                return await Assembly.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                logger.error(`Assembly.allAssemblyClub: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        allAssemblyTeam: async (obj, {idTeam, withClubMembers}, context, info) =>  {
            try {
                if (!idTeam) return []

                const order = [["first_name", "ASC"], ["second_name", "ASC"], ["third_name", "ASC"], ["tribe", "ASC"]]

                if (!withClubMembers) {
                    return await Assembly.findAll({ where: { id_team: idTeam }, order })
                }

                // Membership records added from the club app, the sheet import or
                // the bulk "add club people" action carry only id_club, never
                // id_team — so a plain id_team lookup comes back empty for them.
                // Link those records to the team through the civil ID numbers of
                // the team's players, technical staff and members.
                const team = await Team.findByPk(idTeam, { attributes: ["id", "id_club"] })
                if (!team) return []

                const ofTeam = {
                    where: { id_team: idTeam },
                    attributes: ["id"],
                    include: [{ model: Person, as: "person", required: true, attributes: ["card_number"] }],
                }
                const [players, technicals, members] = await Promise.all([
                    Players.findAll(ofTeam),
                    TechnicalApparatus.findAll(ofTeam),
                    Members.findAll(ofTeam),
                ])
                const cards = [...new Set(
                    [...players, ...technicals, ...members]
                        .map((row) => ("" + (row.person?.card_number ?? "")).trim())
                        .filter(Boolean)
                )]

                const matches = [{ id_team: idTeam }]
                if (team.id_club && cards.length) {
                    matches.push({ id_club: team.id_club, card_number: { [Op.in]: cards } })
                }

                const rows = await Assembly.findAll({ where: { [Op.or]: matches }, order })

                // The same person can be on file twice (team record + club record).
                const seen = new Set()
                return rows.filter((row) => {
                    const key = ("" + (row.card_number ?? "")).trim() || row.id
                    if (seen.has(key)) return false
                    seen.add(key)
                    return true
                })
            } catch (error) {
                logger.error(`Assembly.allAssemblyTeam: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

    },

    Assembly: {
        club: async ({id_club}, {}, context, info) =>  {
            try {
                return await Club.findByPk(id_club)
            } catch (error) {
                logger.error(`Assembly.club: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        team: async ({id_team}, {}, context, info) =>  {
            try {
                return await Team.findByPk(id_team)
            } catch (error) {
                logger.error(`Assembly.team: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        affiliations: async ({card_number}, {}, context, info) =>  {
            const card = ("" + (card_number ?? "")).trim();
            if (!card || !context?.loaders?.affiliationsByCardNumber) return [];
            try {
                return await context.loaders.affiliationsByCardNumber.load(card);
            } catch (error) {
                logger.error(`Assembly.affiliations error: ${error?.message}`);
                return [];
            }
        },
    },

    Mutation: {
        // «تسجيل عضو جديد» من الفريق: يدخل العضوية بانتظار النادي، ويُفتح له طلبه
        // على الطريق نفسه — قبولٌ ورسوم عضوية سنوية واعتماد. والتصنيف بعد ذلك.
        registerMember: async (obj, { content }, context) => {
            try {
                const idTeam = await callerTeamId(context);
                if (!idTeam) return new ApolloError("تسجيل العضو يكون من حساب الفريق", "FORBIDDEN_ROLE");
                const team = await Team.findByPk(idTeam, { attributes: ["id", "name", "id_club"] });
                if (!team?.id_club) return new ApolloError("الفريق غير مرتبط بنادٍ", "TEAM_WITHOUT_CLUB");

                const problem = registrationProblem(content);
                if (problem) return new ApolloError(problem, "INVALID_MEMBER");
                const card = normalizeCardNumber(content.card_number);

                const existing = await Assembly.findOne({
                    where: { card_number: card },
                    include: [{ model: Team, attributes: ["name"] }, { model: Club, attributes: ["name"] }],
                });
                if (existing) {
                    const where = existing.team?.name || existing.club?.name || "نادٍ آخر";
                    return new ApolloError(
                        existing.id_team === idTeam && existing.status === "rejected"
                            ? "سجّلته من قبل ورفضه النادي — عدّل طلبه وأعد إرساله من «الطلبات»، أو احذفه ثم سجّله"
                            : `صاحب هذا الرقم المدني عضوٌ مسجَّل في ${where}`,
                        "CARD_NUMBER_ALREADY_EXISTS",
                    );
                }

                const [nationalID, nationalIDBack, personal_picture] = await Promise.all([
                    saveImage(content.nationalID), saveImage(content.nationalIDBack), saveImage(content.personal_picture),
                ]);

                const member = await Assembly.create({
                    first_name: content.first_name, second_name: content.second_name,
                    third_name: content.third_name || "", tribe: content.tribe,
                    date_birth: content.date_birth, card_number: card,
                    phone: normalizeCardNumber(content.phone), gender: content.gender || "male",
                    type: content.type || null,
                    nationalID, nationalIDBack, personal_picture,
                    status: "waiting_club",
                    id_team: idTeam, id_club: team.id_club,
                });

                const flow = await openFlow({
                    request_type: "member_registration", entity_type: "assembly", entity_id: member.id,
                    id_club: team.id_club, id_team: idTeam, actor: "team", id_user: context.user?.id || null,
                });
                // عضوٌ بلا طلب ينتظر نادياً لن يراه أبداً: لا يُترك معلّقاً.
                if (!flow) {
                    await member.destroy({ force: true });
                    return new ApolloError("تعذّر إرسال طلب التسجيل إلى النادي — لم يُسجَّل العضو، حاول مرة أخرى", "FLOW_FAILED");
                }
                const name = [content.first_name, content.second_name, content.tribe].filter(Boolean).join(" ");
                void CreateDirectNotification({
                    id_club: team.id_club,
                    body: `طلب تسجيل عضو جديد من ${team.name}: ${name} — بانتظار مراجعتك`,
                });
                return member;
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                if (error?.code === "NOT_AN_IMAGE") return new ApolloError(error.message, error.code);
                logger.error(`Assembly.registerMember: ${error?.message || error}`);
                throw new ApolloError("تعذّر تسجيل العضو");
            }
        },

        createAssembly: async (obj, {content}, context, info) =>  {
            try {
                const nationalID = await content.nationalID
                const nationalIDBack = await content.nationalIDBack
                const personal_picture = await content.personal_picture

                const oldPersonalPicture = content.oldPersonalPicture
                const oldNationalID = content.oldNationalID
                const oldNationalIDBack = content.oldNationalIDBack
             

                const oneAssembly = await Assembly.findOne({where: {card_number: content.card_number}})
                if (oneAssembly) {
                    return new ApolloError("card number already exists", "CARD_NUMBER_ALREADY_EXISTS")
                }

                let data = {...content}

                if (nationalID) {
                    console.log("nationalID:",nationalID)
                    const { createReadStream, filename, mimetype, encoding } = nationalID;
                    const listType = ["JPEG", "JPG", "PNG"]

                    const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    if(!listType.includes(fileType)) { return new ApolloError("National ID is not image") }

                    let uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    data = {...data, nationalID: uniqName}
                } else {
                    data = {...data, nationalID: oldNationalID}
                }

                if (nationalIDBack) {
                    const { createReadStream, filename, mimetype, encoding } = nationalIDBack;
                    const listType = ["JPEG", "JPG", "PNG"]

                    const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    if(!listType.includes(fileType)) { return new ApolloError("National ID is not image") }

                    let uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    data = {...data, nationalIDBack: uniqName}
                } else {
                    data = {...data, nationalIDBack: oldNationalIDBack}
                }

                if (personal_picture) {
                    const { createReadStream, filename, mimetype, encoding } = personal_picture;
                    const listType = ["JPEG", "JPG", "PNG"]

                    const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    if(!listType.includes(fileType)) { return new ApolloError("National ID is not image") }

                    let uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    data = {...data, personal_picture: uniqName}
                } else {
                    data = {...data, personal_picture: oldPersonalPicture}
                }

                return await Assembly.create({...data})
            } catch (error) {
                logger.error(`Assembly.createAssembly: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        updateAssembly: async (obj, {id, content}, context, info) =>  {
            try {
                const nationalID = await content.nationalID
                const nationalIDBack = await content.nationalIDBack

                const personal_picture = await content.personal_picture

                if (nationalID || nationalIDBack || personal_picture) {
                    let data = {...content}

                    if (nationalID) {
                        const { createReadStream, filename, mimetype, encoding } = nationalID;
                        const listType = ["JPEG", "JPG", "PNG"]

                        const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        if(!listType.includes(fileType)) { return new ApolloError("National ID is not image") }

                        let uniqName = `${UUID()}.${fileType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );

                        data = {...data, nationalID: uniqName}
                    }

                    if (nationalIDBack) {
                        const { createReadStream, filename, mimetype, encoding } = nationalIDBack;
                        const listType = ["JPEG", "JPG", "PNG"]

                        const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        if(!listType.includes(fileType)) { return new ApolloError("national ID Back is not image") }

                        let uniqName = `${UUID()}.${fileType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );

                        data = {...data, nationalIDBack: uniqName}
                    }

                    if (personal_picture) {
                        const { createReadStream, filename, mimetype, encoding } = personal_picture;
                        const listType = ["JPEG", "JPG", "PNG"]

                        const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        if(!listType.includes(fileType)) { return new ApolloError("personal_picture ID is not image") }

                        let uniqName = `${UUID()}.${fileType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );

                        data = {...data, personal_picture: uniqName}
                    }

                    let result = await Assembly.update({...data}, { where: { id } })

                    return {
                        status: result[0] === 1
                    }
                } else {
                    let result = await Assembly.update({...content}, { where: { id } })

                    return {
                        status: result[0] === 1
                    }
                }
            } catch (error) {
                logger.error(`Assembly.updateAssembly: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        deleteAssembly: async (obj, {id}, context, info) =>  {
            try {
                const team = await Assembly.destroy({ where: { id } })

                return {
                    status: team === 1
                }
            } catch (error) {
                logger.error(`Assembly.deleteAssembly: ${error?.message || error}`)
                throw new ApolloError(error)
            }
        },

        // Bulk-add the club's players, technical staff and board members to the
        // general assembly — the same record "إضافة عضو موجود" creates, done for
        // every existing person at once. Idempotent by card number.
        addClubPeopleToAssembly: async (obj, {idClub}, context, info) =>  {
            try {
                const withClub = (type) => ({
                    include: [
                        { model: Team, as: "team", required: true, where: { id_club: idClub } },
                        { model: Person, as: "person", required: true },
                    ],
                });

                const [players, technicals, members] = await Promise.all([
                    Players.findAll(withClub()),
                    TechnicalApparatus.findAll(withClub()),
                    Members.findAll(withClub()),
                ]);

                const groups = [
                    { rows: players, type: "لاعب" },
                    { rows: technicals, type: "جهاز فني" },
                    { rows: members, type: "عضو" },
                ];

                // Skip anyone already in the assembly (by card number).
                const existing = await Assembly.findAll({ where: { id_club: idClub }, attributes: ["card_number"] });
                const seen = new Set(existing.map((a) => ("" + (a.card_number ?? "")).trim()).filter(Boolean));

                const cap = (s) => ("" + (s ?? "")).slice(0, 20);
                const today = new Date().toISOString().slice(0, 10);
                const toCreate = [];
                let skipped = 0, total = 0;

                for (const g of groups) {
                    for (const row of g.rows) {
                        const p = row.person;
                        if (!p) continue;
                        total++;
                        const card = ("" + (p.card_number ?? "")).trim();
                        if (card && seen.has(card)) { skipped++; continue; }
                        if (card) seen.add(card);
                        toCreate.push({
                            first_name: cap(p.first_name),
                            second_name: cap(p.second_name),
                            third_name: cap(p.third_name),
                            tribe: cap(p.tribe),
                            card_number: p.card_number || null,
                            phone: p.phone ? ("" + p.phone).slice(0, 20) : null,
                            date_birth: p.date_birth || null,
                            personal_picture: p.personal_picture || null,
                            type: g.type,
                            membership_date: today,
                            id_club: idClub,
                        });
                    }
                }

                if (toCreate.length) {
                    await Assembly.bulkCreate(toCreate, { validate: false });
                }

                return { added: toCreate.length, skipped, total };
            } catch (error) {
                logger.error(`addClubPeopleToAssembly error: ${error?.message}`);
                throw new ApolloError(error);
            }
        }
    }
}
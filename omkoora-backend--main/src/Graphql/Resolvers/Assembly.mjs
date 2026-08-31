import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';

import logger from "../../Config/logger.mjs";

import {Club, Members, Person, Assembly, User, Team, Players, TechnicalApparatus,} from '../../Models/index.mjs';
import {createWriteStream} from "fs";
import {__dirname} from "../../app.mjs";


dotenv.config();


const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        assembly: async (obj, {id}, context, info) =>  {
            try {
                return await Assembly.findByPk(id)
            } catch (error) {
                logger.error("")
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
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allAssemblyTeam: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Assembly.findAll({
                    where: {
                        id_team: idTeam
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

    },

    Assembly: {
        club: async ({id_club}, {}, context, info) =>  {
            try {
                return await Club.findByPk(id_club)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        team: async ({id_team}, {}, context, info) =>  {
            try {
                return await Team.findByPk(id_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Mutation: {
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
                logger.error("")
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
                logger.error("")
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
                logger.error("")
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
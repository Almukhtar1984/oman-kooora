import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Members, Person, Players, Team, TechnicalApparatus, AttachmentPerson} from '../../Models/index.mjs';
import {v4 as UUID} from "uuid";
import path from "path";
import {__dirname} from "../../app.mjs";
import {createWriteStream, promises as fsPromises} from "fs";
import {saveUpload} from "../../Helpers/Upload.mjs";

dotenv.config();

const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        technicalApparatus: async (obj, {id}, context, info) =>  {
            try {
                return await TechnicalApparatus.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allTechnicalApparatus: async (obj, {idTeam}, context, info) =>  {
            try {
                return await TechnicalApparatus.findAll({
                    where: {
                        id_team: idTeam
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allTechnicalApparatusClub: async (obj, {idClub}, context, info) =>  {
            try {
                return await TechnicalApparatus.findAll({
                    include: {
                        model: Team,
                        as: "team",
                        required: true,
                        right: true,
                        where: {
                            id_club: idClub
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    TechnicalApparatus: {
        person: async ({id_person}, {}, context, info) =>  {
            if (!id_person) return null;
            try {
                if (context?.loaders?.person) {
                    return await context.loaders.person.load(id_person);
                }
                return await Person.findByPk(id_person)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        team: async ({id_team}, {}, context, info) =>  {
            if (!id_team) return null;
            try {
                if (context?.loaders?.team) {
                    return await context.loaders.team.load(id_team);
                }
                return await Team.findByPk(id_team)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        attachmentsTechnical: async (parent, {}, context, info) => {
            if (parent?.attachmentsTechnical) return parent.attachmentsTechnical;
            if (!parent?.id) return [];
            try {
                return await AttachmentPerson.findAll({
                    where: { id_technical_apparatus: parent.id }
                });
            } catch (error) {
                logger.error(`attachmentsTechnical error: ${error?.message}`);
                throw new ApolloError(error);
            }
        }
    },

    Mutation: {
        createTechnicalApparatus: async (obj, {content}, context, info) =>  {
            try {
                const onePerson = await Person.findOne({ where: {card_number: content.person.card_number, phone: content.person.phone} })
                if (onePerson) {
                    if (onePerson.card_number === content.person.card_number) {
                        return new ApolloError("card number already exists", "CARD_NUMBER_ALREADY_EXISTS")
                    } else if (onePerson.phone === content.person.phone) {
                        return new ApolloError("phone number already exists", "PHONE_NUMBER_ALREADY_EXISTS")
                    }
                }

                let person = await Person.create(content.person)

                let result = null
                if (person) {
                    let uniqName = "";

                    if (content.testimony_experience) {
                        const { createReadStream, filename, mimetype, encoding } = await content.testimony_experience;

                        const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                        if(fileType !== "PDF") { return new ApolloError("This file is not pdf") }

                        uniqName = `${UUID()}.${fileType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );
                    }

                    result = await TechnicalApparatus.create({
                        ...content,
                        testimony_experience: uniqName,
                        id_person: person.id
                    })
                }

                return result
            } catch (error) {
                console.log({ error })
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateTechnicalApparatus: async (obj, {id, idPerson, content}, context, info) =>  {
            try {
                let person = null
                if (content.person) {
                    const personPatch = {...content.person};
                    if (!personPatch.personal_picture) delete personPatch.personal_picture;
                    person = await Person.update(personPatch, { where: { id: idPerson } })
                }

                const testimonyExperience = await content.testimony_experience
                let uniqName = "";
                if (testimonyExperience) {
                    const { createReadStream, filename, mimetype, encoding } = testimonyExperience;

                    const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    if(fileType !== "PDF") { return new ApolloError("This file is not pdf") }

                    uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );
                }

                let result = await TechnicalApparatus.update({...content, testimony_experience: uniqName}, { where: { id } })

                return {
                    status: result[0] === 1 || person[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        changeStatusTechnicalApparatus: async (obj, {id, status, note}, context, info) =>  {
            try {

                let result = await TechnicalApparatus.update({status, note}, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        changeStatusTechnicalApparatusBulk: async (obj, {ids, status, note}, context, info) =>  {
            try {
                if (!ids || ids.length === 0) {
                    return { success: 0, total: 0 }
                }

                const patch = note !== undefined && note !== null ? {status, note} : {status}
                const [affected] = await TechnicalApparatus.update(patch, { where: { id: { [Op.in]: ids } } })

                return { success: affected, total: ids.length }
            } catch (error) {
                logger.error(`changeStatusTechnicalApparatusBulk error: ${error.message}`)
                throw new ApolloError(error)
            }
        },

        deleteTechnicalApparatus: async (obj, {id}, context, info) =>  {
            try {
                const technicalApparatus = await TechnicalApparatus.findByPk(id)
                const result = await TechnicalApparatus.destroy({ where: { id } })

                if (result === 1) {
                    await Person.destroy({ where: { id: technicalApparatus.id_person } })
                }
                return {
                    status: result === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        // Attachments for a technical-staff member — same storage + safe upload
        // as player attachments, keyed by id_technical_apparatus.
        addAttachmentTechnical: async (obj, {idTechnical, attachments}, context, info) => {
            try {
                if (!idTechnical) throw new ApolloError("معرف عضو الجهاز الفني مطلوب", "TECHNICAL_REQUIRED");

                const uploads = attachments || [];
                const allResult = [];

                // Await each file to disk in order (graphql-upload requirement)
                // before creating the DB row.
                for (const upload of uploads) {
                    const storedName = await saveUpload(upload);
                    const result = await AttachmentPerson.create({ id_technical_apparatus: idTechnical, content: storedName });
                    allResult.push(result);
                }

                return allResult;
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error(`addAttachmentTechnical failed: ${error?.message}`);
                throw new ApolloError(error?.message || "فشل إضافة المرفقات", "ATTACHMENT_UPLOAD_FAILED");
            }
        },

        deleteAttachmentTechnical: async (obj, {id}, context, info) => {
            try {
                const attachment = await AttachmentPerson.findByPk(id);
                const result = await AttachmentPerson.destroy({ where: { id } });

                if (result === 1 && attachment?.content) {
                    const filePath = path.join(__dirname, `./../uploads/${attachment.content}`);
                    try {
                        await fsPromises.unlink(filePath);
                    } catch (err) {
                        logger.warn(`deleteAttachmentTechnical: could not unlink ${filePath}: ${err?.message}`);
                    }
                }

                return { status: result === 1 };
            } catch (error) {
                throw new ApolloError(error);
            }
        },
    }
}
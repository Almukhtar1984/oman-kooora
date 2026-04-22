import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {Club, Team, Form} from '../../Models/index.mjs';
import {assertCanAccessClub, assertCanAccessRecordScope} from "../../Helpers/Authorization.mjs";
import {v4 as UUID} from "uuid";
import path from "path";
import {__dirname} from "../../app.mjs";
import {createWriteStream} from "fs";

dotenv.config();

const {Op, col} = sequelize;

export const resolvers = {
    Query: {
        form: async (obj, {id}, context, info) =>  {
            try {
                const form = await Form.findByPk(id)
                await assertCanAccessRecordScope(context, form);

                return form
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allForms: async (obj, {idClub}, context, info) =>  {
            try {
                await assertCanAccessClub(context, idClub);

                return await Form.findAll({
                    where: {
                        id_club: idClub
                    }
                })
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },

    Form: {
        club: async ({id_club}, {}, context, info) =>  {
            try {
                return await Club.findByPk(id_club)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        }
    },


    Mutation: {
        createForm: async (obj, {content}, context, info) =>  {
            try {
                await assertCanAccessRecordScope(context, content);

                const file = await content.file;

                let form = await Form.create({...content, file: ""})

                if (form && file) {
                    const listType = ["JPEG", "JPG", "PNG", "MP4", "PDF", "DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "CSV", "ZIP"]

                    const { createReadStream, filename, mimetype, encoding } = await file;

                    const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    const isImage = listType.indexOf(imgType) !== -1

                    if(!isImage) { return new ApolloError("This file is not image") }

                    const imgUniqName = `${UUID()}.${imgType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    await Form.update({file: imgUniqName}, {where: {id: form.id}})
                }

                return form
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                console.log(error)
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateForm: async (obj, {id, content}, context, info) =>  {
            try {
                const form = await Form.findByPk(id);
                if (!form) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessRecordScope(context, form);
                await assertCanAccessRecordScope(context, content);

                const file = await content.file;
                delete content.file

                let result = await Form.update({...content}, { where: { id } })

                if (file) {
                    const listType = ["JPEG", "JPG", "PNG", "MP4", "PDF", "DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "CSV", "ZIP"]

                    const { createReadStream, filename, mimetype, encoding } = await file;

                    const imgType = filename.split(".")[filename.split(".").length-1].toUpperCase()

                    const isImage = listType.indexOf(imgType) !== -1

                    if(!isImage) { return new ApolloError("This file is not image") }

                    const imgUniqName = `${UUID()}.${imgType}`;
                    const pathName = path.join(__dirname,   `./../uploads/${imgUniqName}`);

                    const stream = createReadStream();
                    await stream.pipe( createWriteStream(pathName) );

                    await Form.update({file: imgUniqName}, {where: {id}})
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteForm: async (obj, {id}, context, info) =>  {
            try {
                const form = await Form.findByPk(id);
                if (!form) {
                    return {
                        status: false
                    }
                }

                await assertCanAccessRecordScope(context, form);

                const meeting = await Form.destroy({ where: { id } })

                return {
                    status: meeting === 1
                }
            } catch (error) {
                if (error instanceof ApolloError) throw error;
                logger.error("")
                throw new ApolloError(error)
            }
        }
    }
}

import { ApolloError, AuthenticationError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'
import path from "path";
import { v4 as UUID } from 'uuid';
import { createWriteStream } from "fs";

import logger from "../../Config/logger.mjs";

import {Request, Players, Team, Person, Attachment} from '../../Models/index.mjs';
import {__dirname} from "../../app.mjs";


dotenv.config();


const {Op, col} = sequelize;

// Files a member may attach to a request/complaint.
const ATTACHMENT_TYPES = ["JPEG", "JPG", "PNG", "MP4", "PDF", "DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "CSV", "ZIP"];

// Short, human-friendly reference the member quotes when following up.
const makeReferenceNumber = () => `REQ-${UUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

// Persist one uploaded file under /uploads and record it against the request.
const saveRequestAttachment = async (upload, idRequest) => {
    const { createReadStream, filename } = await upload;
    const ext = filename.split(".").pop().toUpperCase();

    if (ATTACHMENT_TYPES.indexOf(ext) === -1) {
        throw new ApolloError(`Unsupported attachment type: ${ext}`, "REQUEST_ATTACHMENT_TYPE");
    }

    const uniqName = `${UUID()}.${ext}`;
    const pathName = path.join(__dirname, `./../uploads/${uniqName}`);

    await new Promise((resolve, reject) => {
        createReadStream()
            .pipe(createWriteStream(pathName))
            .on("finish", resolve)
            .on("error", reject);
    });

    await Attachment.create({ content: uniqName, id_request: idRequest });
};

// The person behind the request: a portal token (portalPerson) or a dashboard
// account linked to a person (user.id_person). Returns null for neither.
const requestPersonId = (context) =>
    context?.portalPerson?.id || context?.user?.id_person || null;

export const resolvers = {
    Query: {
        request: async (obj, {id}, context, info) =>  {
            try {
                return await Request.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allRequests: async (obj, {idPlayer, type}, context, info) =>  {
            try {
                return await Request.findAll({
                    where: {
                        id_player: idPlayer,
                        type
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        
        allRequestsTeam: async (obj, {idTeam}, context, info) =>  {
            if (!idTeam) return []   // team-scoped: no team → no rows (avoids the undefined-where crash)
            try {
                return await Request.findAll({
                    include: {
                        model: Players,
                        as: "player",
                        required: true,
                        right: true,
                        where: {
                            id_team: idTeam
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        // The signed-in member's own requests. Reads the person from the portal
        // token (or a linked dashboard account) and returns every request filed
        // against any player row that person owns.
        portalRequests: async (obj, args, context, info) => {
            const idPerson = requestPersonId(context);
            if (!idPerson) {
                throw new AuthenticationError("You must be signed in to the member portal");
            }
            try {
                const players = await Players.findAll({ where: { id_person: idPerson } });
                const playerIds = players.map((p) => p.id);
                if (playerIds.length === 0) return [];

                return await Request.findAll({
                    where: { id_player: { [Op.in]: playerIds } },
                    order: [['createdAt', 'DESC']],
                });
            } catch (error) {
                logger.error(`portalRequests error: ${error.message || error}`);
                throw new ApolloError(error);
            }
        },
        authexternal: async (obj, {CardNumber,phoneNumber}, context, info) =>  {

            try {

                // Step 1: Find the person using cardNumber and phoneNumber
                const person = await Person.findOne({
                    where: {
                        card_number: CardNumber,
                        phone: phoneNumber
                    }
                });
        
                if (!person) {
                    throw new Error('Person not found');
                }
        
                // Step 2: Find the player using the person's ID
                const player = await Players.findOne({
                    where: {
                        id_person: person.id
                    }
                });
        
                if (!player) {
                    throw new Error('Player not found');
                }
        
                return player;
            } catch (error) {
                throw new Error(error.message);
            }
        }
    },

    Request: {
        player: async ({id_player}, {id}, context, info) =>  {
            try {
                return await Players.findByPk(id_player)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        attachments: async ({id}, args, context, info) => {
            if (!id) return [];
            try {
                return await Attachment.findAll({ where: { id_request: id } });
            } catch (error) {
                logger.error(`Request.attachments error: ${error.message || error}`);
                throw new ApolloError(error);
            }
        }
    },
    

    Mutation: {
        createRequest: async (obj, {content}, context, info) =>  {
            try {
                // `attachments` are files, not a column — keep them out of create().
                const { attachments, ...fields } = content;

                const request = await Request.create({
                    ...fields,
                    reference_number: makeReferenceNumber(),
                });

                if (attachments && attachments.length > 0) {
                    for (const upload of attachments) {
                        await saveRequestAttachment(upload, request.id);
                    }
                }

                return request;
            } catch (error) {
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        updateRequest: async (obj, {id, content}, context, info) =>  {
            try {
                // `attachments` are files, not a column — pull them out.
                const { attachments, ...fields } = content;

                // Writing a reply stamps the time it was sent.
                if (fields.admin_reply !== undefined && fields.admin_reply !== null) {
                    fields.replied_at = new Date();
                }

                let result = await Request.update(fields, { where: { id } })

                if (attachments && attachments.length > 0) {
                    for (const upload of attachments) {
                        await saveRequestAttachment(upload, id);
                    }
                }

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                // logger.error("")
                throw new ApolloError(error)
            }
        },

        deleteRequest: async (obj, {id}, context, info) =>  {
            try {
                const team = await Request.destroy({ where: { id } })

                return {
                    status: team === 1
                }
            } catch (error) {
                // logger.error("")
                throw new ApolloError(error)
            }
        },
        createRequestExternal: async (obj, { content }, context, info) => {
 
            try {
              // Step 1: Find the player by `id_person`
              const player = await Players.findOne({
                where: {
                  id_person: content.id_person,
                },
              });
      
              if (!player) {
                throw new ApolloError("يرجى منك اضافت الشكوى في المتصة المخصصة لحسابك , حسابك ليس حساب لاعب");
              }
      
              // Step 2: Set the player ID in the request content
              const requestData = {
                ...content,      // Copy other content fields
                id_player: player.id,  // Assign player.id to id_player
                reference_number: makeReferenceNumber(),
              };
      
              // Step 3: Create the request
              const newRequest = await Request.create(requestData);
      
              return newRequest;
            } catch (error) {
              // Log error (you can use logger.error here if needed)
              throw new ApolloError(error.message);
            }
          },
    }
}

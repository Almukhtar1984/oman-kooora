import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {AttachmentPerson, Club, Members, Person, Players, Team, Transfer} from '../../Models/index.mjs';
import { isIdentical } from '../../Helpers/index.mjs';
import {saveImageUpload, savePdfUpload, saveDocumentUpload} from "../../Helpers/Upload.mjs";


dotenv.config();


const {Op, col, literal} = sequelize;

export const resolvers = {
    Query: {
        player: async (obj, {id}, context, info) =>  {
            try {
                return await Players.findByPk(id)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allPlayers: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Players.findAll({
                    where: {
                        id_team: idTeam
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allPlayersClub: async (obj, {idClub}, context, info) =>  {
            try {
                return await Players.findAll({
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
        },

        allPlayersByClass: async (obj, {idTeam, className}, context, info) =>  {
            try {
                return await Players.findAll({
                    where: {
                        id_team: idTeam,
                        class: className
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allPlayersClubByClass: async (obj, {idClub, className}, context, info) =>  {
            try {
                return await Players.findAll({
                    where: {
                        class: className
                    },
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
        },

        allPlayersClubTransferred: async (obj, {idClub}, context, info) =>  {
            try {
                return await Players.findAll({
                    where: {
                        [Op.or]: [
                            {"$transfer.id_club_to$": idClub},
                            {"$team.id_club$": idClub}
                        ]
                    },
                    include: [
                        {
                            model: Team,
                            as: "team",
                            required: true,
                            right: true
                        },
                        {
                            model: Transfer,
                            as: "transfer",
                            required: true,
                            right: true,
                            on: {
                                id_player: {[Op.eq]: col("player.id")},
                                [Op.or]: [
                                    {id_team_from: {[Op.eq]: col("team.id")}},
                                    {id_team_to: {[Op.eq]: col("team.id")}}
                                ]
                            },
                            where: {
                                id: {
                                    [Op.eq]: literal(`(
                                        SELECT transfers.id FROM transfers
                                        WHERE transfers.id_player = transfer.id_player
                                        ORDER BY transfers.createdAt DESC
                                        LIMIT 0, 1
                                    )`)
                                },
                                transition_type: "transition"
                            }
                        }
                    ]
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allPlayersClubLoaned: async (obj, {idClub}, context, info) =>  {
            try {
                return await Players.findAll({
                    include: [
                        {
                            model: Team,
                            as: "team",
                            required: true,
                            right: true,
                            where: {
                                id_club: idClub
                            }
                        },
                        {
                            model: Transfer,
                            as: "transfer",
                            required: true,
                            right: true,
                            on: {
                                id_player: {[Op.eq]: col("player.id")},
                                [Op.or]: [
                                    {id_team_from: {[Op.eq]: col("team.id")}},
                                    {id_team_to: {[Op.eq]: col("team.id")}}
                                ]
                            },
                            where: {
                                id: {
                                    [Op.eq]: literal(`(
                                        SELECT transfers.id FROM transfers
                                        WHERE transfers.id_player = transfer.id_player
                                        ORDER BY transfers.createdAt DESC
                                        LIMIT 0, 1
                                    )`)
                                },
                                transition_type: {
                                    [Op.in]: ["loan", "returning"]
                                }
                            }
                        }
                    ]
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        checkIdentical: async (obj, {image, cardID}, context, info) =>  {
            try {
                const value = await isIdentical(image, cardID)

                return value
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Player: {
        person: async ({id_person}, {}, context, info) =>  {
            try {
                return await Person.findByPk(id_person)
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        transfer: async ({id}, {}, context, info) =>  {
            try {
                return await Transfer.findAll({
                    where: {
                        id_player: id
                    },
                    order: [['createdAt', 'DESC']]
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        lastTransfer: async ({id}, {}, context, info) =>  {
            try {
                return await Transfer.findOne({
                    where: {
                        id_player: id
                    },
                    order: [['createdAt', 'DESC']]
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        lastLoan: async ({id}, {}, context, info) =>  {
            try {
                return await Transfer.findOne({
                    where: {
                        id_player: id,
                        transition_type: {
                            [Op.in]: ["loan", "returning"]
                        }
                    },
                    order: [['createdAt', 'DESC']]
                })
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
        club: async ({id_team}, {}, context, info) =>  {
            try {
                return await Club.findAll({
                    include: {
                        model: Team,
                        as: "team",
                        required: true,
                        right: true,
                        where: {
                            id: id_team
                        }
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        attachmentsPlayer: async ({id}, {}, context, info) =>  {
            try {
                return await AttachmentPerson.findAll({
                    where: {
                        id_player: id
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Mutation: {
        createPlayer: async (obj, {content}, context, info) =>  {
            try {
                const onePerson = await Person.findOne({
                    where: {
                        [Op.or]: [
                            {card_number: content.person.card_number},
                            {phone: content.person.phone}
                        ]
                    }
                })
                if (onePerson) {
                    if (onePerson.card_number === content.person.card_number) {
                        return new ApolloError("card number already exists", "CARD_NUMBER_ALREADY_EXISTS")
                    } else if (onePerson.phone === content.person.phone) {
                        return new ApolloError("phone number already exists", "PHONE_NUMBER_ALREADY_EXISTS")
                    }
                }

                let person = await Person.create(content.person)

                const nationalID = await content.nationalID
                const nationalIDBack = await content.nationalIDBack
                const parentApproval = await content.parentApproval

                if (content.nationalID) delete content.nationalID
                if (content.nationalIDBack) delete content.nationalIDBack
                if (content.parentApproval) delete content.parentApproval

                let result = null
                if (person) {
                    result = await Players.create({...content, id_person: person.id})
                }

                if (result && nationalID) {
                    const uniqName = await saveImageUpload(nationalID);
                    await Players.update({nationalID: uniqName}, {where: {id: result.id}})
                }

                if (result && nationalIDBack) {
                    const uniqName = await saveImageUpload(nationalIDBack);
                    await Players.update({nationalIDBack: uniqName}, {where: {id: result.id}})
                }

                if (result && parentApproval) {
                    const uniqName = await savePdfUpload(parentApproval);
                    await Players.update({parentApproval: uniqName}, {where: {id: result.id}})
                }

                return result
            } catch (error) {
                logger.error("Unable to create player")
                throw new ApolloError(error)
            }
        },

        createListPlayer: async (obj, {content}, context, info) =>  {
            try {
                let allResults = []
                for (let index = 0; index < content.length; index++) {
                    const element = content[index];

                    const onePerson = await Person.findOne({
                        where: {
                            [Op.or]: [
                                {card_number: element.person.card_number},
                                {phone: element.person.phone}
                            ]
                        }
                    })
                    if (!onePerson) {
                        let person = await Person.create(element.person)
                        if (person) {
                            let result = await Players.create({...element, id_person: person.id})
                            allResults.push(result)
                        }
                    }
                }

                return allResults
            } catch (error) {
                throw new ApolloError(error)
            }
        },

        updatePlayer: async (obj, {id, idPerson, content}, context, info) =>  {
            try {
                const nationalID = await content.nationalID
                const nationalIDBack = await content.nationalIDBack
                const parentApproval = await content.parentApproval

                if (content.nationalID) delete content.nationalID
                if (content.nationalIDBack) delete content.nationalIDBack
                if (content.parentApproval) delete content.parentApproval

                let person = null
                if (content.person) {
                    person = await Person.update({...content.person}, { where: { id: idPerson } })
                }

                let result = await Players.update(content, { where: { id } })

                if (nationalID) {
                    const uniqName = await saveImageUpload(nationalID);
                    await Players.update({nationalID: uniqName}, {where: {id}})
                }

                if (nationalIDBack) {
                    const uniqName = await saveImageUpload(nationalIDBack);
                    await Players.update({nationalIDBack: uniqName}, {where: {id}})
                }

                if (parentApproval) {
                    const uniqName = await savePdfUpload(parentApproval);
                    await Players.update({parentApproval: uniqName}, {where: {id}})
                }

                return {
                    status: result[0] === 1 || person[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        changeStatusPlayer: async (obj, {id, status, note}, context, info) =>  {
            try {

                let result = await Players.update({status, note}, { where: { id } })

                return {
                    status: result[0] === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        deletePlayer: async (obj, {id}, context, info) =>  {
            try {
                const player = await Players.findByPk(id)
                const result = await Players.destroy({ where: { id }, force: true })

                if (result === 1) {
                    await Person.destroy({ where: { id: player.id_person }, force: true })
                }

                return {
                    status: result === 1
                }
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        addAttachmentPlayer: async (obj, {idPlayer, attachments}, context, info) =>  {
            try {
                const allAttachments = await attachments

                let allResult = []
                if (allAttachments && allAttachments.length > 0) {
                    for (let index = 0; index < allAttachments.length; index++) {
                        const uniqName = await saveDocumentUpload(allAttachments[index]);
                        const result = await AttachmentPerson.create({id_player: idPlayer, content: uniqName})
                        allResult.push(result)
                    }
                }

                return allResult
            } catch (error) {
                throw new ApolloError(error)
            }
        },

        deleteAttachmentPlayer: async (obj, {id}, context, info) =>  {
            try {
                const result = await AttachmentPerson.destroy({ where: { id } })

                return {
                    status: result === 1
                }
            } catch (error) {
                throw new ApolloError(error)
            }
        },
    }
}

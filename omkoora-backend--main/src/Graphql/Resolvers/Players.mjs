import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv'

import logger from "../../Config/logger.mjs";

import {AttachmentPerson, Club, Members, Person, TechnicalApparatus,Players, Team, Transfer,Sanction,ParticipatingPlayers,ParticipatingTeams,League,ScorerMatch,ParticipatingPlayersMatch} from '../../Models/index.mjs';
import {v4 as UUID} from "uuid";
import path from "path";
import {__dirname} from "../../app.mjs";
import {createWriteStream, promises as fsPromises } from "fs";
import { match } from 'assert';
import {isIdentical} from "../../Helpers/isIdentical.mjs"
import {CreateNotificationClub} from "../../Helpers/index.mjs"


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

        playerAccepted: async (obj, {id}, context, info) =>  {
            try {
                //return await Players.findByPk(id)
                return await Players.findAll({
                    where: {
                      id,
                      status: 'accepted'
                    }
                  });
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        
        allPlayers: async (obj, {idTeam}, context, info) =>  {
            try {
                return await Players.findAll({
                    where: { id_team: idTeam },
                    include: [
                        { model: Person, as: "person" },
                        { model: Team, as: "team" },
                        { model: AttachmentPerson, as: "attachmentsPlayer" },
                    ],
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },

        allPlayersAccpted: async (obj, {idTeam}, context, info) =>  {
         
            try {
                return await Players.findAll({
                    where: {
                        id_team: idTeam,
                        status:'accepted'
                    }
                })
            } catch (error) {
                logger.error("errore !!;:")
                throw new ApolloError(error)
            }
        },
        allPlayersAcceptedExternal: async (obj, { limit = 50, offset = 0 }, context, info) => {
            console.log("zabi zabi")
            try {
                const [players, totalCount] = await Promise.all([
                    Players.findAll({
                        where: { status: 'accepted' },
                        limit,
                        offset
                    }),
                    Players.count({
                        where: { status: 'accepted' }
                    })
                ]);

                return {
                    players,
                    totalCount
                };
            } catch (error) {
                logger.error("Error fetching players:", error);
                throw new ApolloError("Failed to fetch players", "INTERNAL_SERVER_ERROR", { originalError: error });
            }
        },
        allPlayersClub: async (obj, {idClub}, context, info) =>  {
            try {
                return await Players.findAll({
                    include: [
                        {
                            model: Team,
                            as: "team",
                            required: true,
                            right: true,
                            where: { id_club: idClub }
                        },
                        { model: Person, as: "person" },
                        { model: AttachmentPerson, as: "attachmentsPlayer" },
                    ]
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
                        class: className,
                        
                    }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
        allPlayersByClassAccpted: async (obj, {idTeam, className}, context, info) =>  {
            try {
                return await Players.findAll({
                    where: {
                        id_team: idTeam,
                        class: className,
                        status: 'accepted'
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
        
        statPlayer: async (_, { id }) => {
            // Fetch the player by ID
            const player = await Players.findByPk(id, {
                include: [
                    {
                        model: Team,
                        as: 'team'
                    },
                    {
                        model: Person,
                        as: 'person'
                    },
                ]
            });
        
            if (!player) {
                throw new Error('Player not found');
            }
        
            // Fetch related data
            const sanctions = await Sanction.findAll({
                where: { id_player: player.id },
                paranoid: false // Include soft-deleted records
            });
        
            // Fetch Participation data where id_player matches
            const participation = await ParticipatingPlayers.findAll({
                where: { id_player: player.id },
                include: [
                    {
                        model: ParticipatingTeams,
                        as: 'participating_team',
                        include: [
                            {
                                model: League,
                                as: 'league'
                            }
                        ]
                    }
                ]
            });
        
            // Fetch all ParticipatingPlayersMatch records where id_player matches in ParticipatingTeams
            const participatingPlayerMatches = await ParticipatingPlayersMatch.findAll({
                include: [
                    {
                        model: ParticipatingPlayers,
                        as: 'participating_player',
                        where: {
                            id_player: player.id
                        },
                        include: [
                            {
                                model: ParticipatingTeams,
                                as: 'participating_team'
                            }
                        ]
                    }
                ]
            });
        
            // Calculate the sum of instances of participating_player_match
            const participatingPlayerMatchCount = participatingPlayerMatches.length;
        
            // Fetch and count the number of goals scored by the player
            const GoalScoreCount = await ScorerMatch.count({
                where: { id_participating_player: participation.map(p => p.id) }
            });
        
            // Construct the StatPlayer object
            const statPlayer = {
                team: player.team,
                Goal: GoalScoreCount, // Return the count of goals scored
                Person: player.person,
                Participation: participation,
                participatingPlayerMatchCount, // Add the count as a separate field
                Sanctions: sanctions
            };
        
            return statPlayer;
        }
        
        
        
    },

    Player: {
        person: async (parent, {}, context, info) =>  {
            // Use eager-loaded relation when allPlayers/allPlayersClub include person.
            if (parent?.person) return parent.person;
            try {
                return await Person.findByPk(parent?.id_person)
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
        team: async (parent, {}, context, info) =>  {
            if (parent?.team) return parent.team;
            try {
                return await Team.findByPk(parent?.id_team)
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
        attachmentsPlayer: async (parent, {}, context, info) =>  {
            if (parent?.attachmentsPlayer) return parent.attachmentsPlayer;
            try {
                return await AttachmentPerson.findAll({
                    where: { id_player: parent?.id }
                })
            } catch (error) {
                logger.error("")
                throw new ApolloError(error)
            }
        },
    },

    Mutation: {
        createPlayer: async (obj, { content }, context, info) => {
            try {
                const onePerson = await Person.findOne({
                    where: {
                        [Op.or]: [
                            { card_number: content.person.card_number },
                            { phone: content.person.phone }
                        ]
                    }
                });
        
                if (onePerson && onePerson !== null) {
                    if (onePerson.card_number === content.person.card_number) {
                        return new ApolloError("card number already exists", "CARD_NUMBER_ALREADY_EXISTS");
                    } else if (onePerson.phone === content.person.phone) {
                        return new ApolloError("phone number already exists", "PHONE_NUMBER_ALREADY_EXISTS");
                    }
                }
        
                const nationalID = content.nationalID;
                const nationalIDBack = content.nationalIDBack;
                const parentApproval = content.parentApproval;
        
                if (!nationalID) {
                    return new ApolloError("National ID is missing", "MISSING_NATIONAL_ID");
                }
                
                if (!nationalIDBack) {
                    return new ApolloError("National ID Back is missing", "MISSING_NATIONAL_BACK_ID");
                }
                console.log("nationalID",nationalID)
                const { createReadStream, filename, mimetype, encoding } = await  nationalID;
        
                const stream = createReadStream();
                const chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                const buffer = Buffer.concat(chunks);
        
                const isTextIdentical = true; // await isIdentical(buffer, content.person.card_number);
        
                if (!isTextIdentical) {
                    return new ApolloError("Card number does not match", "CARD_NUMBER_DONT_MATCH");
                }
        
                let person = await Person.create(content.person);
        
                if (content.nationalID) delete content.nationalID;
                if (content.nationalIDBack) delete content.nationalIDBack;
                if (content.parentApproval) delete content.parentApproval;
                if (!content.type) content.type = "internal";
        
                let result = null;
                if (person) {
                    result = await Players.create({ ...content, id_person: person.id });
                }
        
                const validImageTypes = ["JPEG", "JPG", "PNG"];
        
                if (result && nationalID) {
                    const fileType = filename.split(".").pop().toUpperCase();
                    if (!validImageTypes.includes(fileType)) {
                        return new ApolloError("National ID is not image", "NATIONAL_ID_NOT_IMAGE");
                    }
        
                    let uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname, `./../uploads/${uniqName}`);
                    const stream = createReadStream();
                    await stream.pipe(createWriteStream(pathName));
                    await Players.update({ nationalID: uniqName }, { where: { id: result.id } });
                }
        
                if (result && nationalIDBack) {
                    const { createReadStream, filename } = await  nationalIDBack;
                    const fileType = filename.split(".").pop().toUpperCase();
                    if (!validImageTypes.includes(fileType)) {
                        return new ApolloError("National ID is not image", "NATIONAL_ID_NOT_IMAGE");
                    }
        
                    let uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname, `./../uploads/${uniqName}`);
                    const stream = createReadStream();
                    await stream.pipe(createWriteStream(pathName));
                    await Players.update({ nationalIDBack: uniqName }, { where: { id: result.id } });
                }
        
                if (result && parentApproval) {
                    const { createReadStream, filename } = await parentApproval;
                    const fileType = filename.split(".").pop().toUpperCase();
                    if (fileType !== "PDF") {
                        return new ApolloError("The Parent Approval is not pdf", "PARENT_APPROVAL_NOT_PDF");
                    }

                    let uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname, `./../uploads/${uniqName}`);
                    const stream = createReadStream();
                    await stream.pipe(createWriteStream(pathName));
                    await Players.update({ parentApproval: uniqName }, { where: { id: result.id } });
                }

                if (result && content.id_team) {
                    try {
                        const team = await Team.findByPk(content.id_team);
                        if (team && team.id_club) {
                            await CreateNotificationClub("player", "create", team.id_club, team.name, result.id);
                        }
                    } catch (notifyErr) {
                        console.error("createPlayer: notification failed", notifyErr);
                    }
                }

                return result;
            } catch (error) {
                console.error(error);
                return new ApolloError(error.message || "Internal server error", "INTERNAL_SERVER_ERROR");
            }
        },
        

        createListPlayer: async (obj, { content }, context, info) => {
            console.log("**** create list player");
            console.log("content", content);
            try {
                let allResults = [];
                let alreadyExistsCount = 0; // Counter for existing people in the database
        
                for (let index = 0; index < content.length; index++) {
                    const element = content[index];
                    console.log("====================element======================");
                    console.log("element", element);
                    console.log("Card Number:", element?.person.card_number);
                    console.log("==========================================");
        
                    // Skip iteration if card_number is undefined
                    if (!element?.person?.card_number) {
                        console.log("Skipping: Card number is undefined");
                        continue;
                    }
        
                    // Check if a person with the same card number or phone already exists
                    const onePerson = await Person.findOne({
                        where: {
                            [Op.or]: [
                                { card_number: element.person.card_number },
                                { phone: element.person.phone }
                            ]
                        }
                    });
        
                    if (onePerson) {
                        // Increment counter if person already exists
                        alreadyExistsCount++;
                    } else {
                        console.log("====== Creating new person ========");
                        // Create new person and player if they don't already exist
                        let person = await Person.create(element.person);
                        if (person) {
                            if (!element.type) {
                                element.type = "internal";
                            }
                            let result = await Players.create({ ...element, id_person: person.id });
                            allResults.push(result);
                        }
                    }
                }
        
                console.log("alreadyExistsCount:", alreadyExistsCount);
        
                // If there are existing records, throw an error with a custom message
                if (alreadyExistsCount > 0) {
                    const error = new ApolloError(`من أصل ${content.length} لم يتم اضافة ${alreadyExistsCount} لاعبا لوجود تكرار الرقم المدني`);
                    error.extensions.code = "DUPLICATE_CIVIL_ID";  // Set custom error code
                    error.extensions.count = alreadyExistsCount;    // Add count to extensions
                    throw error;
                }
                // Return both the created players and the count of already existing people
                return {
                    createdPlayers: allResults
                };
            } catch (error) {
                console.log("error", error);
                throw new ApolloError(error.message, error.code || "INTERNAL_SERVER_ERROR");
            }
        }
        
        ,
        

        updatePlayer: async (obj, { id, idPerson, content }, context, info) => {
            try {
                const nationalID = content.nationalID;
                const nationalIDBack = content.nationalIDBack;
                const parentApproval = content.parentApproval;
        
                // Check if card_number exists in content.person
                if (content?.person?.card_number) {
                    // Look up an existing Person with the same card_number
                    const existingPerson = await Person.findOne({
                        where: { card_number: content.person.card_number }
                    });
        
                    // If a different person has the same card_number, throw an error
                    if (existingPerson && existingPerson.id !== idPerson) {
                        throw new ApolloError("CARD_NUMBER_ALREADY_EXISTS", "CARD_NUMBER_ALREADY_EXISTS");
                    }
                }
        
                // Remove these fields from content as they will be handled separately
                if ("nationalID" in content) delete content.nationalID;
                if ("nationalIDBack" in content) delete content.nationalIDBack;
                if ("parentApproval" in content) delete content.parentApproval;
        
                // Update the person information if content.person exists
                let person = null;
                if (content.person) {
                    // personal_picture is uploaded via the dedicated addImagePlayer
                    // mutation, never via updatePlayer. If a stale form ever sends
                    // an empty/undefined value here, dropping it prevents the saved
                    // image from being silently nulled (e.g. after a transfer/loan
                    // when the receiving team edits the player).
                    const personPatch = { ...content.person };
                    if (!personPatch.personal_picture) {
                        delete personPatch.personal_picture;
                    }
                    person = await Person.update(personPatch, { where: { id: idPerson } });
                }
                if (!content.type) {
                    content.type = "internal";
                }
                // Update the player information
                let result = await Players.update(content, { where: { id } });
        
                // Process file uploads for nationalID, nationalIDBack, and parentApproval
                const listType = ["JPEG", "JPG", "PNG"];
        
                if (nationalID) {
                    const { createReadStream, filename } = await nationalID;
                    const fileType = filename.split(".").pop().toUpperCase();
        
                    if (!listType.includes(fileType)) {
                        throw new ApolloError("National ID is not a valid image type");
                    }
        
                    const uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname, `./../uploads/${uniqName}`);
                    const stream = createReadStream();
                    await stream.pipe(createWriteStream(pathName));
        
                    await Players.update({ nationalID: uniqName }, { where: { id } });
                }
        
                if (nationalIDBack) {
                    const { createReadStream, filename } = await nationalIDBack;
                    const fileType = filename.split(".").pop().toUpperCase();
        
                    if (!listType.includes(fileType)) {
                        throw new ApolloError("National ID Back is not a valid image type");
                    }
        
                    const uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname, `./../uploads/${uniqName}`);
                    const stream = createReadStream();
                    await stream.pipe(createWriteStream(pathName));
        
                    await Players.update({ nationalIDBack: uniqName }, { where: { id } });
                }
        
                if (parentApproval) {
                    const { createReadStream, filename } = await parentApproval;
                    const fileType = filename.split(".").pop().toUpperCase();
        
                    if (fileType !== "PDF") {
                        throw new ApolloError("The Parent Approval is not a PDF");
                    }
        
                    const uniqName = `${UUID()}.${fileType}`;
                    const pathName = path.join(__dirname, `./../uploads/${uniqName}`);
                    const stream = createReadStream();
                    await stream.pipe(createWriteStream(pathName));
        
                    await Players.update({ parentApproval: uniqName }, { where: { id } });
                }
        
                return {
                    status: result[0] === 1 || (person && person[0] === 1)
                };
            } catch (error) {
                logger.error("Error in updatePlayer:", error);
                throw new ApolloError(error.message || "An unexpected error occurred");
            }
        }
        ,
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
                const result = await Players.destroy({
                    where: { id }
                })

                if (result === 1) {
                    await Person.destroy({
                        where: { id: player.id_person }
                    })
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
                        const { createReadStream, filename, mimetype, encoding } = await allAttachments[index];
                        const listType = ["JPEG", "JPG", "PNG", "PDF", "DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "CSV", "ZIP"]
    
                        const fileType = filename.split(".")[filename.split(".").length-1].toUpperCase()
    
                        if(!listType.includes(fileType)) { return new ApolloError("National ID is not image") }
    
                        let uniqName = `${UUID()}.${fileType}`;
                        const pathName = path.join(__dirname,   `./../uploads/${uniqName}`);
    
                        const stream = createReadStream();
                        await stream.pipe( createWriteStream(pathName) );
    
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
                const attachment = await AttachmentPerson.findByPk(id)
                const result = await AttachmentPerson.destroy({ where: { id } })

                if (result === 1 && attachment?.content) {
                    const filePath = path.join(__dirname, `./../uploads/${attachment.content}`)
                    try {
                        await fsPromises.unlink(filePath)
                    } catch (err) {
                        // File may already be missing on disk; the DB row is gone, that's the source of truth.
                        logger.warn(`deleteAttachmentPlayer: could not unlink ${filePath}: ${err?.message}`)
                    }
                }

                return {
                    status: result === 1
                }
            } catch (error) {
                throw new ApolloError(error)
            }
        },

        convertPlayerToTechnical: async (_, { idPlayer, classification, membership_date, membership_date_end }, context) => {
            console.log("==========================")
            console.log("idPlayer",idPlayer)
            console.log("classification",classification)
            console.log("membership_date",membership_date)
            console.log("membership_date_end",membership_date_end)
            try {
                // Find the player by ID
                const player = await Players.findByPk(idPlayer, {
                    include: [{ model: Person, as: "person" }, { model: Team, as: "team" }]
                });

                if (!player) {
                    throw new ApolloError("Player not found", "PLAYER_NOT_FOUND");
                }

             
                // Create new Technical Apparatus record
                const technical = await TechnicalApparatus.create({
                    id_person: player.id_person, // Link to the same person
                    id_team: player.id_team, // Link to the same team
                    classification,
                    membership_date,
                    membership_date_end,
                    occupation: player.job, // Automatically use the player's job
                    testimony_experience: "", 
                });

                // Remove player record (optional)
                await Players.destroy({ where: { id: idPlayer } });

                return technical;
            } catch (error) {
                console.error("Error converting player to technical:", error);
                throw new ApolloError("Failed to convert player to technical", "CONVERSION_FAILED");
            }
        },

        convertTechnicalToPlayer: async (_, { idTechnical, activity, player_center, class: playerClass }, context) => {
            try {
          
                // Find the Technical Apparatus by ID
                const technical = await TechnicalApparatus.findByPk(idTechnical, {
                    include: [{ model: Person, as: "person" }, { model: Team, as: "team" }]
                });
        
                if (!technical) {
                    throw new ApolloError("Technical Apparatus not found", "TECHNICAL_NOT_FOUND");
                }
        
                // Create a new Player record
                const player = await Players.create({
                    id_person: technical.id_person, // Link to the same person
                    id_team: technical.id_team, // Link to the same team
                    activity,
                    player_center,
                    class: playerClass,
                    job: technical.occupation, // Automatically use the technical's job
                    status: "waiting"
                });
        
                // Remove the Technical Apparatus record
                await TechnicalApparatus.destroy({ where: { id: idTechnical } });
        
                // Return the newly created player
                return player;
            } catch (error) {
                console.error("Error converting technical to player:", error);
                throw new ApolloError("Failed to convert technical to player", "CONVERSION_FAILED");
            }
        },
        associatePlayer: async (_, { id_player, id_team }) => {
            try {
              const result = await Players.update(
                { id_team },
                { where: { id: id_player } }
              );
          
              return {
                status: result[0] === 1
              };
            } catch (error) {
              console.error("Error in associatePlayer:", error);
              throw new ApolloError("Failed to associate player to team");
            }
          },
          

    
    }
}
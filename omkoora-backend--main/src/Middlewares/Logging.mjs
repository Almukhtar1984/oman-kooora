import {ActionLog,Team} from "../Models/index.mjs";
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken';
import { User } from '../Models/index.mjs';
dotenv.config();
const JWT_SECRET = process.env.SECRET_JWT

//content is not regular
const Blacklist = [
    'Transfer',
    'Request',
    'Assembly',
    'Comment',
    'Reservations',
    'ScorerMatch',
    'ParticipatingPlayersMatch',
    'Arbitre',
    'Sanction'
];

//id_person in content
const PersonRquest = [
    'User',
    'AdminMember',
    'Player',
    'TechnicalApparatus',
    'ClubManagement'
];

//id_club in content
const ClubRquest = [
    'Club',
    'Blog',
    'Message',
    'Expense',
    'Meeting',
    'Form',
    'Permission',
    'League'
];

//id_team in content 

const TeamRquest = [
    'Team',
    'Member',
    'AdminMember',
    'Player',
    'ListPlayer',
    'TechnicalApparatus',
    'Blog',
    'Message',
    'Meeting',
    'Permission',
    'ParticipatingTeams',
    'Match',
    'MatchCard',
    'ParticipatingPlayers',
    'ParticipatingTechnicalStaff'
];

export const LoggingMiddleware = async  (req, res, next) => {
    const { query , variables , operationName } = req.body;
    if (query) {
        const queryType = query.trim().split(' ')[0];
        const queryName = operationName


        
       
    
        if (queryType === 'mutation') {
            // Add your specific logic for mutations here

            const authHeader = req.headers.authorization;
            let userId = null;
            if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
                try {
                    const decodedToken = jwt.verify(token, JWT_SECRET);
    
                    userId = decodedToken.id; // Assumes the token payload contains a `userId` field
                } catch (error) {
                    console.log("test here")
                    console.error('Token verification failed:', error);
                }
            }

            const operationTypes = ['Create','Update','Delete',]
            let ActionType = null
            let EntityType = queryName;

            // Find the operation type in the queryName
            for (let operation of operationTypes) {
                if (queryName.startsWith(operation)) {
                    ActionType = operation;
                    EntityType = queryName.substring(operation.length);
                    break;
                }
            }

            switch (ActionType) {
                case "Create":
                    //console.log("Variables:", variables.content); 
                    break;
                case "Update":
                    console.log("**");
                    break;
                case "Delete":
                    console.log("**");
                    break;

            }
            
            const actionLog = await ActionLog.create({ action_name : queryName, 
                success : false ,
                id_user : userId, 
                action_type : ActionType, 
                entity_type : EntityType,   
                id_team : variables?.content?.id_team,
                id_club : variables?.content?.id_club,
                id_player :variables?.content?.id_player,
                entity_type: variables?.id
            });
            console.log('Query Name:', queryName);
            req.ActionLog = actionLog.id;
        }
    } else {
        console.log('No GraphQL query found in the request body');
    }
    next();
};
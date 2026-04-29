import { ActionLog,Club,User,Person, ClubManagement,Members,Team } from "../Models/index.mjs";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import {CreateNotificationMessage ,CreateNotificationMemeber} from "../Helpers/Notification/index.mjs"


dotenv.config();
const JWT_SECRET = process.env.SECRET_JWT;

const operationTypes = ['Create', 'Update', 'Delete','Change'];
const TeamRquest = [
    'Sanction'
];

const ClubRquest = [
    'club',
    'Member',
    'AdminMember',
    'Player',
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

const LoggingPlugin = {
    requestDidStart(requestContext) {
        return {
            async willSendResponse(requestContext) {
                
                const { response, context } = requestContext;
                const { req } = context;
                const { query, variables, operationName } = req.body;

                if (!query) {
                    console.log('No GraphQL query found in the request body');
                    return;
                }
                const queryType = query.trim().split(' ')[0];
                const queryName = operationName;
                
                
                if (queryType !== 'mutation') {
                    
                    return;
                }
             
                const authHeader = req.headers.authorization;
                let userId = null;

                //find user id
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.split(' ')[1];
                    try {
                        const decodedToken = jwt.verify(token, JWT_SECRET);
                        userId = decodedToken.id; // Assumes the token payload contains a `userId` field
                    } catch (error) {
                        //console.error('Token verification failed:', error);
                        return
                    }
                }


                //find id_club
                let id_club = null;
                let id_team = null;
                let user_role = 4
                
                if(variables?.content?.id_club !== undefined){
                    id_club = variables?.content?.id_club
                }

                else{
                    try {
                        const user = await User.findOne({
                            where: { id: userId },
                  
                        });
                        //console.log(user)
                        user_role = user.role
                        switch (user.role) {
                            case "1":
                              //SuperAdmin
                                //entity_id = response?.data[queryName]?.id;
                                id_club = variables?.content?.id_club
                                id_team = variables?.content?.id_team
                                
                                break;
                            case "2": 
                                //adminClub
                                const clubManagment = await ClubManagement.findOne({
                                    where: {id_person:user.id_person}
                                   
                                  })
                                  id_club = clubManagment.id_club
                                  id_team = variables?.content?.id_team
                                  
                                break;
                            case "3":
                                //adminTeam
                                const memeber = await Members.findOne({
                                    where: {id_person:user.id_person},
                                    include: {
                                      model: Team,
                                      as: "team",
                                  }
                                  })
                                  id_club = memeber.team.id_club
         
                                  id_team = memeber.team.id
                                break;
            
                        }
                   
                    
                    } catch (error) {
                        //console.error('err', error);
                        return
                    }
                }
               

                let ActionType = null;
                let EntityType = queryName;
                // Find the operation type in the queryName
                try{
                for (let operation of operationTypes) {
        
                    if (queryName.startsWith(operation)) {
                      
                        ActionType = operation;
                        EntityType = queryName.substring(operation.length);
                        
                        break;
                    }
                }}
                catch(error){
                    console.error("error:",error)
                    return;
                }
                if (!ActionType) {  
                    return;
                }
                
                let entity_id = null;
                if(!response.errors ){
                        try{
                        switch (ActionType) {
                            case "Create":
                                entity_id = response?.data["create"+EntityType]?.id;
                                
                                break;
                            case "Update":
                                entity_id = variables?.id
                                break;
                            case "Delete":
                            
                                entity_id = variables?.id
                                break;
                            case "Change":
                                entity_id = variables?.id
                                ActionType = "Update"
            
                        }}
                        catch{
                            console.error('switch logs:', error);
                        }
            }
                
              

               
                try {
                    // Create the log entry with the success status and entity ID if available
                 
                    const actionLog = await ActionLog.create({
                        action_name: queryName,
                        success: !response.errors,
                        id_user: userId,
                        action_type: ActionType,
                        entity_type: EntityType,
                        id_team: id_team,
                        id_club: id_club,
                        id_player: variables?.content?.id_player,
                        entity_id: entity_id,
                        level : user_role,
                    });
                    //console.log("EntityType:",EntityType)
                    //console.log("action_type:",ActionType)
                    if(!(!response.errors)){
                        console.log("the request not success")
                        return
                    }
                    if( ActionType ==="Create" &&  EntityType ==="Message"){
                       
                        CreateNotificationMessage(variables?.content)
                    } 
                    if( ActionType ==="Create" &&  EntityType ==="Technical"){
                       
                    
                        CreateNotificationMemeber(id_club,"Technical")
                    } 

                    if( ActionType ==="Create" &&  EntityType ==="Member"){
                       
                        
                        CreateNotificationMemeber(id_club,"Member")
                    } 

                    if( ActionType ==="Create" &&  EntityType ==="Player"){
                       
                        
                        CreateNotificationMemeber(id_club,"Player")
                    } 
                    //console.log("id_club:",id_club)
                    //console.log("id_team:",id_team)
                    //console.log(!response.errors)
                    /*

               
                        console.log("in plugin work snaction ")
                        console.log("---msg---")
                        console.log("viables :",variables)
                        console.log("EntityType:",EntityType)
                        console.log("action_type:",ActionType)
                       console.log("id_team:",id_team)
                        console.log("id_club:",id_club)
                        
                        console.log("id_player:",variables?.content?.id_player,)*/
                    

                    //console.log(`Logged query ID ${actionLog.id} with status ${!response.errors}`);
                 
                } catch (error) {
                    //console.error('error creating logs:', error);
                    CreateNotificationMessage(variables.content)
                    
                }
            },
        };
    },
};

export default LoggingPlugin;

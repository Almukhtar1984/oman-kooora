import {Notification} from "../../Models/index.mjs"
import {getSocketServerInstance } from "../../Socket/index.mjs"
import {Team} from "../../Models/index.mjs"



export const CreateNotificationMessage = async (content) => {
    console.log("inside create ")
    try {
    let BodyText = "لديك رسالة جديدة"
    const socketServer = getSocketServerInstance();
    
        if("id_team_receiver" in content){
            //message to team
            
            let id_team = content.id_team_receiver
            
            const notification = await Notification.create({
                body : BodyText,
                id_team: id_team ,
        
            });
            socketServer.sendNewNotification('team',id_team, notification);
        }
        else {
      
            if(content.id_club_sender.length === 0){
                //club to team
                let id_team = content.id_team_sender
                const team = await Team.findByPk(id_team)
           
                let id_club =team.id_club
                const notification = await Notification.create({
                    body : BodyText,
                    id_club: id_club ,
            
                });
                socketServer.sendNewNotification('club',id_club, notification);

            }
            else{
                //from club to all
                let id_club = content.id_club_sender
                const team = await Team.findAll({
                    where: {
                        id_club: id_club
                    }
                })
                await Promise.all(
                    team.map(async t => {
                        const notification = await Notification.create({
                            body: BodyText,
                            id_team: t.id,
                        });
                        socketServer.sendNewNotification('team', t.id, notification);
                    })
                );
            }
        }
    }
        
    catch (error) {
        console.error("Error occurred:", error);
        return;
    }


    
    
}

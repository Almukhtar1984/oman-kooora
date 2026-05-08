import {Notification} from "../Models/index.mjs"
import {getSocketServerInstance } from "../Socket/index.mjs"
import { Team,Players ,Person} from "../Models/index.mjs"


const operationTypes = {
    'create':"اضافة", 
    'update':"تحديث", 
    'delete':"مسح"
}

const FieldTypes = {
    'team':"اضافة", 
    'club':"تحديث", 
    'legue':"مسح",
    'player':"لاعب",
    "sanction":"عقوبة"
}
const getPName = async (Category, id) => {
    switch (Category) {
        case "player":
            try {
                const player = await Players.findByPk(id, {
                    include: [
                        {
                            model: Person,
                            as: 'person'
                        },
                    ]
                });
                
                if (player && player.person) {
                    let msg = player.person.first_name +  " " + player.person.second_name +  " " + player.person.third_name;
                    console.log(msg)
                    return msg
                } else {
                    return "";
                }
            } catch (error) {
                console.error("Error fetching player name:", error);
                return "Error fetching player name";
            }
        case "team":
            return " فريق النور";
        case "club":
            return "احمد محمد";
        case "club":
                return "احمد محمد";
        case "accepted":
            return "قبول"
        case "rejected": 
            return "رفض"
        default:
            return "Invalid category";
    }
};

export const CreateNotificationClub = async (Category , FunctionType ,id_club,team,id_Player) => {
    let functionType = operationTypes[FunctionType]
    let BodyText = ''
    try {
        switch (Category){
            case "player":
                BodyText = " تم "+ functionType +" لاعب في فريق " + team
                break
            case "sanction":
                BodyText = " تم "+ functionType +" عقوبة على اللاعب " + await getPName("player", id_Player)
                break
        }
        const notification = await Notification.create({
            id_club : id_club,
            body : BodyText,
        });
        const socketServer = getSocketServerInstance();
        if (socketServer) {
            await socketServer.sendNewNotification('club', id_club, notification);
        }
    } catch (error) {
        console.error("CreateNotificationClub error:", error);
    }
}

//CreateNotificationTeam("memeber","update",Members.id_team,Members.id)
export const CreateNotificationTeam = async (Category , FunctionType ,id_team,id_Player) => {
    
    let functionType = operationTypes[FunctionType]
    let BodyText = ''
    try {
        let team = await Team.findByPk(id_team)
       
        switch (Category){
            case "player":
                BodyText = " تم "+ functionType +" لاعب في فريق " //+getPName()
                break
            case "sanction":
                let name = await getPName("player",id_Player)
                console.log( name)
                BodyText = " تم "+ functionType +" عقوبة على اللاعب "+  name
                break
            case "memeber":
            
                BodyText = " تم "+ functionType +" عضو في الفريق " 
                break
            case "teamUpdateAdd":
            
                BodyText = `تم ${FunctionType === true ? "تفعيل" : "توقيف"} اضافة اللاعبين من طرف النادي`;
           
                break
            case "teamUpdateStatus":
                BodyText = `تم ${FunctionType === true ? "تفعيل" : "توقيف"} الفريق من طرف النادي`;
                break

            case "message":
                return
                
        }
        const notification = await Notification.create({
            //id_club : team.id_club,
            body : BodyText,
            id_team:  id_team,
    
        });
        const socketServer = getSocketServerInstance();
               await socketServer.sendNewNotification('team',id_team, notification);
               //await socketServer.sendNewNotification('club',team.id_club, notification);
    
    
    }
        
    catch (error) {
        console.error("Error occurred:", error);
        return;
    }


    
    
}




export const CreateNotificationMessage = async (Category , FunctionType ,id_team,id_Player) => {
    
    let functionType = operationTypes[FunctionType]
    let BodyText = ''
    try {
        let team = await Team.findByPk(id_team)
       
        switch (Category){
            case "player":
                BodyText = " تم "+ functionType +" لاعب في فريق " //+getPName()
                break
            case "sanction":
                let name = await getPName("player",id_Player)
                console.log( name)
                BodyText = " تم "+ functionType +" عقوبة على اللاعب "+  name
                break
            case "memeber":
            
                BodyText = " تم "+ functionType +" عضو في الفريق " 
                break
            case "teamUpdateAdd":
            
                BodyText = `تم ${FunctionType === true ? "تفعيل" : "توقيف"} اضافة اللاعبين من طرف النادي`;
           
                break
            case "teamUpdateStatus":
                BodyText = `تم ${FunctionType === true ? "تفعيل" : "توقيف"} الفريق من طرف النادي`;
                break

            case "message":
                return
                
        }
        const notification = await Notification.create({
            //id_club : team.id_club,
            body : BodyText,
            id_team:  id_team,
    
        });
        const socketServer = getSocketServerInstance();
               await socketServer.sendNewNotification('team',id_team, notification);
               //await socketServer.sendNewNotification('club',team.id_club, notification);
    
    
    }
        
    catch (error) {
        console.error("Error occurred:", error);
        return;
    }


    
    
}


export const CreateNotificationPlayer = async (Category , FunctionType ,id_team,id_Player) => {
    console.log('inside notification team')
    let functionType = operationTypes[FunctionType]
    let BodyText = ''
    try {
        let team = await Team.findByPk(id_team)
        console.log(team)
        switch (Category){
            case "player":
                BodyText = " تم "+ functionType +" لاعب في فريق " +getPName()
            case "sanction":
                BodyText = " تم "+ functionType +" عقوبة على اللاعب " +getPName("player",id_Player)
                
        }
        const notification = await Notification.create({
            id_club : team.id_club,
            body : BodyText,
            id_team:  id_team,
    
        });
        const socketServer = getSocketServerInstance();
               await socketServer.sendNewNotification('team',id_team, notification);
               //await socketServer.sendNewNotification('club',team.id_club, notification);
    
    
    }
        
    catch (error) {
        console.error("Error occurred:", error);
        return;
    }


    
    
}








export const CreateNotificationLeague = async (Category , FunctionType ,id_club,id_team,id_Player) => {
    let category = ''
    let functionType = ''
    let BodyText = ''

    const Notification = await ActionLog.create({
        
    });
}


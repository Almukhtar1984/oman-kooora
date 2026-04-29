import {Notification} from "../../Models/index.mjs"
import {getSocketServerInstance } from "../../Socket/index.mjs"
import {Team} from "../../Models/index.mjs"



export const CreateNotificationMemeber = async (id_club,type) => {
    console.log("inside create ")
    let BodyText = ""
    try {
    switch(type){
        case "Technical":
            BodyText = "تم اضافة عضو جديد في الحهاز الفني" 
            break;
        case "Member":
            BodyText = "تم اضافة عضو جديد في  مجلس ادارة"
            break;
        case "Player":
            BodyText = "تم اضافة لاعب جديد"
            break;
            
    }
   
    const socketServer = getSocketServerInstance();
    const notification = await Notification.create({
        body: BodyText,
        id_club: id_club,
    });
    socketServer.sendNewNotification('club', id_club, notification);
    }
    catch (error) {
        console.error("Error occurred:", error);
        return;
    }


    
    
}

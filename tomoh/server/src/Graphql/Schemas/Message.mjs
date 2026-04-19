import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        message(id: ID): Message #@auth(requires: user)
        allMessage(idClub: ID): [Message!] #@auth(requires: user)
        
        allMessageClubSender(idClub: ID): [Message!] #@auth(requires: user)
        allMessageClubReceiver(idClub: ID): [Message!] #@auth(requires: user)

        allMessageTeamSender(idTeam: ID): [Message!] #@auth(requires: user)
        allMessageTeamReceiver(idTeam: ID): [Message!] #@auth(requires: user)
    }

    extend type Mutation {
        createMessage (content: contentMessage!): Message! #@auth(requires: user)

        updateMessage (id: ID!, content: contentMessage!): statusUpdate #@auth(requires: user)

        deleteMessage ( id: ID! ): statusDelete #@auth(requires: user)
        
        createComment (content: contentComment!): Comment! #@auth(requires: user)

        updateComment (id: ID!, content: contentComment!): statusUpdate #@auth(requires: user)

        deleteComment ( id: ID! ): statusDelete #@auth(requires: user)
    }

    type Message {
        id:               ID
        
        subject:          String
        content:          String
        priority:         String
        logo:             String @imgUrl
        attachment:       [Attachment]
        comment:       [Comment]

        club_sender:      Club
        club_receiver:    Club
        team_sender:      Team
        team_receiver:    Team

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentMessage {
        subject:          String
        content:          String
        priority:         String
        logo:             Upload
        attachment:       [Upload]

        id_club_sender:   ID
        id_team_sender:   ID
        id_team_receiver: ID
        id_club_receiver: ID
    }
    
    type Attachment {
        id:               ID
        content:          String

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type Comment {
        id:               ID
        content:          String
        note:               String
        team:       Team
        club:      Club

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentComment {
        content:    String
        note:       String
        id_message: ID
        id_team:    ID
        id_club:    ID
    }
`;

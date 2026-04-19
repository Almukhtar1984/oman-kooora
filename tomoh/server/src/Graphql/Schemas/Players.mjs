import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        player(id: ID): Player #@auth(requires: user)
        allPlayers(idTeam: ID): [Player!] #@auth(requires: user)
        allPlayersClub(idClub: ID): [Player!] #@auth(requires: user)
        allPlayersByClass(idTeam: ID, className: String): [Player!] #@auth(requires: user)
        allPlayersClubByClass(idClub: ID, className: String): [Player!] #@auth(requires: user)

        allPlayersClubTransferred(idClub: ID): [Player!] #@auth(requires: user)
        allPlayersClubLoaned(idClub: ID): [Player!] #@auth(requires: user)

        checkIdentical(image: String, cardID: String): Boolean #@auth(requires: user)
    }

    extend type Mutation {
        createPlayer(content: contentPlayer!): Player! #@auth(requires: user)
        createListPlayer(content: [contentPlayer!]): [Player!] #@auth(requires: user)

        updatePlayer (id: ID!, idPerson: ID!, content: contentPlayer!): statusUpdate #@auth(requires: user)

        changeStatusPlayer (id: ID!, status: String!, note: String): statusUpdate #@auth(requires: user)

        deletePlayer ( id: ID! ): statusDelete #@auth(requires: user)

        addAttachmentPlayer (idPlayer: ID!, attachments: [Upload!]): [AttachmentPlayer] #@auth(requires: user)
        updateAttachmentPlayer (idPlayer: ID!, attachments: [Upload!]): [AttachmentPlayer] #@auth(requires: user)
        deleteAttachmentPlayer ( id: ID! ): statusDelete #@auth(requires: user)
    }

    type Player {
        id:             ID
        activity:       String
        player_center:  String
        job:            String
        nationalID:     String
        nationalIDBack: String
        
        parentApproval: String
        
        status:         String
        note:           String
        class:          String
        
        person:         Person
        team:           Team
        club:           Club
        transfer:       [Transfer]
        lastTransfer:   Transfer
        lastLoan:       Transfer
        attachmentsPlayer: [AttachmentPlayer]

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentPlayer {
        activity:       String
        player_center:  String
        job:            String
        nationalID:     Upload
        nationalIDBack: Upload
        parentApproval: Upload

        class:          String
        
        person:         contentPerson
        id_team:            ID
    }

    type AttachmentPlayer {
        id:            ID
        content:       String
        player:         Player
    }
`;

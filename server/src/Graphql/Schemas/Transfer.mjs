import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        transfer(id: ID): Transfer #@auth(requires: user)
        allTransfer(idClub: ID): [Transfer!] #@auth(requires: user)
        allTransferTeam(idTeam: ID, transitionType: [String]): [Transfer!] #@auth(requires: user)
        
        allTransferClub(idClub: ID): [Transfer!] #@auth(requires: user)
    }

    extend type Mutation {
        createTransfer(content: contentTransfer!): Transfer! #@auth(requires: user)

        updateTransfer (id: ID!, content: contentTransfer!): statusUpdate #@auth(requires: user)

        deleteTransfer ( id: ID! ): statusDelete #@auth(requires: user)
    }

    type Transfer {
        id:           ID
        status:       String
        type:         String
        team_from:    Team
        team_to:      Team
        club_to:      Club
        id_player:    ID
        player:       Player

        transition_type:  String
        date_end:         Date  @date(format: "yyyy-MM-dd")
        date_start:       Date  @date(format: "yyyy-MM-dd")

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentTransfer {
        status:       String
        type:         String

        transition_type:  String
        date_end:         String
        date_start:       String
        
        id_team_from: ID
        id_team_to:   ID
        id_player:    ID
        id_club_to:   ID
    }
`;

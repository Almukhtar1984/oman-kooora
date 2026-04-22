import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        team(id: ID): Team @auth(requires: user)
        allTeam(idClub: ID): [Team!] #@auth(requires: user)
        allTeams: [Team!] #@auth(requires: user)
        statisticsTeam(idTeam: ID): StatisticsTeam
        statisticsClub(idClub: ID): StatisticsClub
    }

    extend type Mutation {
        createTeam(content: contentTeam!): Team! @auth(requires: user)

        updateTeam (id: ID!, content: contentTeam!): statusUpdate @auth(requires: user)

        deleteTeam ( id: ID! ): statusDelete @auth(requires: user)
    }

    type Team {
        id:             ID
        name:           String
        category:       Int
        enableAddPlayer: Boolean

        logo:           String @imgUrl
        phone:          String
        manager_name:   String
        activities:     String
        account_status: Boolean
        code:           String

        club:           Club
        admin:          User

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentTeam {
        name:           String
        category:       Int
        enableAddPlayer: Boolean
        
        logo:           Upload
        phone:          String
        manager_name:   String
        activities:     String
        account_status: Boolean
        code:           String
        id_club:        ID
    }

    type StatisticsTeam {
        numberPlayers:      Int
        numberPlayersWaiting:      Int
        numberPlayersRejected:      Int
        numberPlayersAccepted:      Int
        numberTechnicales:  Int
        numberMembers:      Int
        numberStadiums:     Int
    }

    type StatisticsClub {
        numberTeams:      Int
        numberPlayers:      Int
        numberPlayersWaiting:      Int
        numberPlayersRejected:      Int
        numberPlayersAccepted:      Int
        numberTechnicales:  Int
        numberMembers:      Int
        numberStadiums:     Int
    }

    
`;

import {gql} from "apollo-server-express";

export const typeDefs = gql`

    extend type Query {
        team(id: ID): Team #@auth(requires: user)
        allTeam(idClub: ID): [Team!] #@auth(requires: user)
        allTeams: [Team!] #@auth(requires: user)
        statisticsTeam(idTeam: ID): StatisticsTeam
        statisticsClub(idClub: ID): StatisticsClub
    }

    extend type Mutation {
        createTeam(content: contentTeam!): Team! #@auth(requires: user)

        # Atomic team+manager creation. Use this from the club "add team" form
        # so a failure on the manager side rolls the team back too, avoiding
        # the duplicate-team-per-retry problem of the two-mutation flow.
        createTeamWithAdmin(team: contentTeam!, manager: contentTeamManager!): Team!

        updateTeam (id: ID!, content: contentTeam!): statusUpdate @auth(requires: user)

        deleteTeam ( id: ID! ): statusDelete @auth(requires: user)
    }

    input contentTeamManager {
        email:               String!
        password:            String!
        occupation:          String
        classification:      String
        membership_date:     String
        membership_date_end: String
        person:              contentPerson!
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
        descreption:    String
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

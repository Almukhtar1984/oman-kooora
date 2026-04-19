import {gql} from "apollo-server-express";

export const typeDefs = gql`
    extend type Query {
        league(id: ID): League #@auth(requires: user)
        allLeagues(idClub: ID): [League!] #@auth(requires: user)

        allParticipatingPlayers(idParticipatingTeams: ID): [ParticipatingPlayers!] #@auth(requires: user)
        
        allParticipatingTechnicalStaff(idParticipatingTeams: ID): [ParticipatingTechnicalStaff!] #@auth(requires: user)

        allScorerMatch(idMatch: ID): [ScorerMatch]
    }

    extend type Mutation {
        createLeague(content: contentLeague!): League! #@auth(requires: user)

        updateLeague (id: ID!, content: contentLeague!): statusUpdate #@auth(requires: user)

        deleteLeague ( id: ID! ): statusDelete #@auth(requires: user)


        createParticipatingTeams (content: [contentParticipatingTeams]!): [ParticipatingTeams!] #@auth(requires: user)

        updateParticipatingTeams (content: [contentUpdateParticipatingTeams]!): statusUpdate #@auth(requires: user)

        deleteParticipatingTeams (id: ID!): statusDelete #@auth(requires: user)


        createMatch (content: contentMatch!): Match! #@auth(requires: user)

        updateMatch (id: ID!, content: contentMatch!): statusUpdate #@auth(requires: user)

        deleteMatch (id: ID!): statusDelete #@auth(requires: user)


        createMatchCard (content: contentMatchCard!): MatchCard! #@auth(requires: user)

        updateMatchCard (id: ID!, content: contentMatchCard!): statusUpdate #@auth(requires: user)

        deleteMatchCard (id: ID!): statusDelete #@auth(requires: user)


        createParticipatingPlayers (content: [contentParticipatingPlayers]!): [ParticipatingPlayers!] #@auth(requires: user)

        updateParticipatingPlayers (content: [contentUpdateParticipatingPlayers]!): statusUpdate #@auth(requires: user)

        deleteParticipatingPlayers (id: ID!): statusDelete #@auth(requires: user)
        

        createParticipatingTechnicalStaff (content: [contentParticipatingTechnicalStaff]!): [ParticipatingTechnicalStaff!] #@auth(requires: user)

        updateParticipatingTechnicalStaff (content: [contentUpdateParticipatingTechnicalStaff]!): statusUpdate #@auth(requires: user)

        deleteParticipatingTechnicalStaff (id: ID!): statusDelete #@auth(requires: user)

        createScorerMatch (content: contentScorerMatch!): ScorerMatch #@auth(requires: user)
        updateScorerMatch (content: [contentUpdateScorerMatch!]): statusUpdate #@auth(requires: user)
    }

    type League {
        id:                 ID
        name:    String
        numberTeams:    Int
        numberGroups:    Int
        description:    String

        startDate:    String
        expiryDate:    String
        
        participatingTeams: [ParticipatingTeams]
        matchs:          [Match]

        club:           Club

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentLeague {
        name:    String
        numberTeams:    Int
        numberGroups:    Int
        description:    String

        startDate:    String
        expiryDate:    String

        id_club:    ID
    }

    type ParticipatingTeams {
        id:             ID
        group:          String

        league:         League
        team:           Team

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentParticipatingTeams {
        group:          String
        id_league:      ID
        id_team:        ID
    }

    input contentUpdateParticipatingTeams {
        id:             ID
        group:          String
        id_league:      ID
        id_team:        ID
    }

    type Match {
        id:             ID
        date:               String
        firstTeamGoal:      Int
        secondTeamGoal:     Int
        type:               String
        
        manOfMatch:         String

        firstTeam:      ParticipatingTeams
        secondTeam:     ParticipatingTeams

        firstTeamScorersMatch: [ScorerMatch]
        secondTeamScorersMatch: [ScorerMatch]


        firstTeamCards:      [MatchCard]
        secondTeamCards:     [MatchCard]

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }
    
    input contentMatch {
        date:               String
        firstTeamGoal:      Int
        secondTeamGoal:     Int
        type:               String

        manOfMatch:         String
        
        first_team:      ID
        second_team:     ID
        id_league:     ID
    }


    type MatchCard {
        id:             ID
        type:        String
        player:      String
        date:        String

        team:     ParticipatingTeams
        match:    Match

        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    input contentMatchCard {
        type:        String
        player:      String
        date:        String

        id_match:    ID
        id_team:     ID
    }


    type ParticipatingPlayers {
        id:                     ID

        number:    String
        participating_team:     ParticipatingTeams
        player:                 Player
        
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }
    
    input contentParticipatingPlayers {
        id_participating_team:  ID
        id_player:              ID

        number:    String
    }
    
    input contentUpdateParticipatingPlayers {
        id:                     ID
        id_participating_team:  ID
        id_player:              ID

        number:    String
    }


    type ParticipatingTechnicalStaff {
        id:                     ID

        participating_team:     ParticipatingTeams
        technicalApparatus:     TechnicalApparatus
        
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }
    
    input contentParticipatingTechnicalStaff {
        id_participating_team:  ID
        id_technical_apparatus:  ID
    }
    
    input contentUpdateParticipatingTechnicalStaff {
        id:                     ID
        id_participating_team:  ID
        id_technical_apparatus: ID
    }

    type ScorerMatch {
        id:  ID
        time:    String
        match:  Match
        participating_team:  ParticipatingTeams
        participating_player:  ParticipatingPlayers
    }
    
    input contentScorerMatch {
        time:    String
        id_match:  ID
        id_participating_team:  ID
        id_participating_player:  ID
    }
    
    input contentUpdateScorerMatch {
        id:  ID
        time:    String
        id_match:  ID
        id_participating_team:  ID
        id_participating_player:  ID
    }

`;

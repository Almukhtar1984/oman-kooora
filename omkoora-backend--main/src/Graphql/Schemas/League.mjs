import {gql} from "apollo-server-express";

export const typeDefs = gql`
    extend type Query {
        league(id: ID): League #@auth(requires: user)
        allLeagues(idClub: ID): [League!] #@auth(requires: user)
        allLeaguesTeam(idTeam: ID): [League!] #@auth(requires: user)
        leagueFull(id: ID): League #@auth(requires: user)
        allLeaguesExternal: [League!]
        getMatch(id: ID) : Match #@auth(requires: user)

        allParticipatingPlayers(idParticipatingTeams: ID): [ParticipatingPlayers!] #@auth(requires: user)

        participatingPlayersByLeague(idLeague: ID!): [ParticipatingPlayers!] #@auth(requires: user)
        
        allParticipatingTechnicalStaff(idParticipatingTeams: ID): [ParticipatingTechnicalStaff!] #@auth(requires: user)

        allScorerMatch(idMatch: ID): [ScorerMatch]
        
        calculatePoints(leagueId: ID!): [TeamPoints]

        calculateGoalPlayer(leagueId: ID!) :[TopGoalPlayer]
        ExternalMatch(id: ID!): MatchExternal #@auth(requires: user)
        GetParticipatingPlayer(id: ID!): ParticipatingPlayers
        getCardsByLeague(leagueId: ID!): LeagueCards
        countExternalPlayers(idTeam: ID!, idLeague: ID!): Int
        GetParticipatingStaff(id: ID!): ParticipatingTechnicalStaff
        getAllMatchesGroupedByType(leagueId: ID!): [MatchGroupByType!] 
        getCardsByLeagueGroupedByMatchType(leagueId: ID!): [MatchCardGroupByType]
    }

    extend type Mutation {
        createLeague(content: contentLeague!): League! #@auth(requires: user)

        updateLeague (id: ID!, content: contentLeague!): statusUpdate #@auth(requires: user)

        deleteLeague ( id: ID! ): statusDelete #@auth(requires: user)


        createParticipatingTeams (content: [contentParticipatingTeams]!): [ParticipatingTeams!] #@auth(requires: user)

        updateParticipatingTeams (content: [contentUpdateParticipatingTeams]!): statusUpdate #@auth(requires: user)

        deleteParticipatingTeams (id: ID!): statusDelete #@auth(requires: user)

        accepteParticipatingTeams (id: ID!): statusUpdate
        rejecteParticipatingTeams (id: ID!): statusUpdate

        createMatch (content: contentMatch!): Match! #@auth(requires: user)

        updateMatch (id: ID!, content: UpdateMatchInput!): statusUpdate #@auth(requires: user)

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


        createParticipatingPlayersMatch (content: [contentParticipatingPlayerMatch]!): [ParticipatingPlayersMatch!] #@auth(requires: user)
        
        updateParticipatingPlayersMatch (content: [contentUpdateParticipatingPlayersMatch]!): statusUpdate #@auth(requires: user)
        deleteParticipatingPlayersMatch (id: ID!): statusDelete #@auth(requires: user)
        updateParticipatingPlayerMatchSub(id: ID!, sub: Boolean!): statusUpdate

        createArbitre (id_match: ID!, Arbitre1: String!, Arbitre2: String!, Arbitre3: String!, Arbitre4: String!): Arbitres #@auth(requires: user)


        generatMatches(leagueId: ID!, type: Int!): statusUpdate!

        freePlayer(id: ID!): statusUpdate
        updateMatchState(id: ID!, state: String!): statusUpdate
        
    }

    type League {
        id:                 ID
        name:    String
        numberTeams:    Int
        numberGroups:    Int
        description:    String

        startDate:    String
        expiryDate:    String
        inscriptionStartDate: String
        inscriptionExpiryDate: String

        externalplayer: Int
        internalplayer: Int

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
        
        inscriptionStartDate: String
        inscriptionExpiryDate: String

        id_club:    ID
        externalplayer: Int
        internalplayer: Int
    }

    type ParticipatingTeams {
        id:             ID
        group:          String
        status:         String
        league:         League
        team:           Team
        participatingPlayers: [ParticipatingPlayers!]
        participatingTechnicalStaff: [ParticipatingTechnicalStaff!] 
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
        
        matchState:     String
        
        firstTeam:      ParticipatingTeams
        secondTeam:     ParticipatingTeams

        firstTeamScorersMatch: [ScorerMatch]
        secondTeamScorersMatch: [ScorerMatch]
        firstTeamParticipatingPlayersMatch: [ParticipatingPlayersMatch]
        secondTeamParticipatingPlayersMatch: [ParticipatingPlayersMatch]

        arbitre: Arbitres
        firstTeamCards:      [MatchCard]
        secondTeamCards:     [MatchCard]

        league: League
        
        penalty: Penalty
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }
    type MatchExternal {
    id: ID
    date: String
    firstTeamGoal: Int
    secondTeamGoal: Int
    type: String
    manOfMatch: String

    firstTeam: ParticipatingTeams
    secondTeam: ParticipatingTeams
    firstTeamScorersMatch: [ScorerMatch]
    secondTeamScorersMatch: [ScorerMatch]
    firstTeamCards: [MatchCard]
    secondTeamCards: [MatchCard]
    arbitre: Arbitres
    league: League

    createdAt: Date @date(format: "yyyy-MM-dd HH:mm:ss")
    updatedAt: Date @date(format: "yyyy-MM-dd HH:mm:ss")
    deletedAt: Date @date(format: "yyyy-MM-dd HH:mm:ss")
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
    input UpdateMatchInput {
        date: String
        firstTeamGoal: Int
        secondTeamGoal: Int
        first_team: ID
        second_team: ID
        manOfMatch: ID
        type: String

        # ✅ Add this line
        penalty: PenaltyInput
        }


    type MatchCard {
        id:             ID
        type:        String
        player:      String
        date:        String

        team:     ParticipatingTeams
        match:    Match

        playerInfo: Player

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
        participatingPlayersMatches: [ParticipatingPlayersMatch]
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type Arbitres {
        id: ID!
        Arbitre1: String!
        Arbitre2: String!
        Arbitre3: String!
        Arbitre4: String!
        id_match: ID!
       
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



    type ParticipatingPlayersMatch {
        id:                     ID

        starter:    Boolean
        sub:    Boolean
        id_match:     Match
        id_participating_player:                 ParticipatingPlayers
        
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        deletedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }
        
    input contentParticipatingPlayerMatch {
        starter: Boolean
        id_match: ID
        id_participating_player: ID
    }

    input contentUpdateParticipatingPlayersMatch {
        id:                     ID
        id_match:  ID
        id_participating_player:              ID

        starter:    Boolean
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
    input PenaltyInput {
        firstTeamPenalty: Int!
        secondTeamPenalty: Int!
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


    type TeamPoints {
        
        team: Team!
        points: Int!
        matchesPlayed: Int!
        group: String
        wins: Int!
        draws: Int!
        losses: Int!
        goalsFor: Int    # total goals scored by the team
        goalsAgainst: Int # total goals conceded
        goalDifference: Int 
        }

    type TopGoalPlayer {
        team: String!
        Goal: Int!
        PlayerID:  ParticipatingPlayers! 
        }
    
        type LeagueCards {
            yellowCards: [PlayerCardStats]
            redCards: [PlayerCardStats]
        }

        type PlayerCardStats {
            player: String
            number: String
            count: Int
            team: Team
        }

        type MatchGroupByType {
            type: String!
            matches: [Match!]!
        }
        type CardPlayerInfo {
            player: String
            number: String
            count: Int
            team: Team
        }

        type MatchCardGroupByType {
            type: String
            yellowCards: [CardPlayerInfo]
            redCards: [CardPlayerInfo]
        }
        type Penalty {
            id: ID
            id_match: ID
            firstTeamPenalty: Int
            secondTeamPenalty: Int
        }

        

`;


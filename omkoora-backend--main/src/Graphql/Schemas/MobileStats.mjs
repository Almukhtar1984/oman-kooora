import { gql } from "apollo-server-express";

// Aggregations and global lists tailored for the mobile app. All read-only,
// built over existing tables (no new columns).
export const typeDefs = gql`
    extend type Query {
        statsTeamsWithPlayerCount: [TeamWithCount!]
        statsPlayersByAgeCategory: [PlayersByAge!]
        statsTransfersByTeam: [TeamTransfersStats!]
        allTechnicalStaff: [TechnicalApparatus!]
        allBoardMembers: [ClubManagement!]
        allEventsGlobal(idTeam: ID): [Event!]
        allBookings: [Reservations!]
        globalSearch(query: String!): GlobalSearchResult
    }

    type TeamWithCount {
        team:         Team
        clubName:     String
        playersCount: Int
    }

    type PlayersByAge {
        ageCategory:  String
        ageLabel:     String
        playersCount: Int
        clubsCount:   Int
        teamsCount:   Int
    }

    type TeamTransfersStats {
        team:           Team
        clubName:       String
        transfersCount: Int
        loansCount:     Int
    }

    type GlobalSearchResult {
        clubs:         [Club]
        teams:         [Team]
        players:       [Player]
        competitions:  [League]
    }
`;

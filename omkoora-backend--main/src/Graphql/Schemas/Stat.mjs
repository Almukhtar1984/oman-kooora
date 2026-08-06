import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  extend type Query {
    StateFilter: Filters
    SearchData(filters: FiltersInput): SearchResult
    FetchAllData:SearchResult
    # Aggregate-only platform statistics for the super-admin dashboard.
    # Returns counts and breakdowns exclusively — no names, IDs, or personal data.
    platformStatistics: PlatformStatistics @auth(requires: user)
  }

  # ---- Aggregate-only statistics (super-admin) ----
  type PlatformStatistics {
    clubs: Int
    teams: Int
    players: Int
    members: Int
    technicals: Int
    boardManagement: Int
    assembly: Int
    stadiums: Int
    leagues: Int
    loans: Int
    transfers: Int
    viewers: Int
    totalPeople: Int
    activities: [ChartResult]
    ageCategories: [ChartResult]
    playersByStatus: [ChartResult]
    clubsByGovernorate: [ChartResult]
    usersByRole: [ChartResult]
    clubTotals: [ClubTotalStat]
  }

  type ClubTotalStat {
    id: ID
    name: String
    governorate: String
    teams: Int
    players: Int
    members: Int
    technicals: Int
    assembly: Int
    board: Int
    leagues: Int
    stadiums: Int
    loans: Int
    transfers: Int
    total: Int
    activities: [ChartResult]
    ageCategories: [ChartResult]
  }

  type Filters {
    Club: [Club]
    Team: [Team]
    League: [League]
  }

  input FiltersInput {
    saison: [String]
    mohfada: [String]
    teams: [ID]
    clubs: [ID]
    leagues: [ID]
    age: [String]
  }

  type SearchResult {
    success: Boolean!
    message: String
    clubs: [Club]
    mohafadaClubCounts: [ChartResult]
    teamCountByClub:[ChartResult]
    playerCountsByAge:[ChartResult]
    matchCountsByYear:[ChartResult]
    stadiumCountByMohafada:[ChartTreeResult]
    teamAgeStats:[ChartTableResult]
    GeneralStat:generalStatType
  }

  type ChartResult {
    name: String
    count: Int
  }
  type ChartTreeResult {
    name: String
    value: Int
  }
  type ChartTableResult{
    clubName:String
    teamName: String
    age: String
    countPlayer: Int
    trophy: Int
    mohafada: String
  }
  type generalStatType{
    Members: Int
    blogs: Int
    acceptedPlayer: Int
    leagues: Int
  }
  # ... other type definitions like Club, Team, League
`;

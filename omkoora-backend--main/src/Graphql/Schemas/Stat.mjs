import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  extend type Query {
    StateFilter: Filters
    SearchData(filters: FiltersInput): SearchResult
    FetchAllData:SearchResult
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

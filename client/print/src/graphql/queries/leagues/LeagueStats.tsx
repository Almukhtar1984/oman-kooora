import { gql } from "@apollo/client";

// One public payload for the printable league-statistics report. Every field
// here is unauthenticated on the backend (calculatePoints / calculateGoalPlayer
// / getCardsByLeague / yellowCardAlerts have no @auth, and
// participatingTeamsByLeague is public too), so the print tab renders from a
// plain link — no token required — exactly like the league-cards / team-roster
// prints. Fetched with errorPolicy "all" so one slow/failing aggregate never
// blanks the whole report.
export const LeagueStatsReport = gql`
    query LeagueStatsReport($id: ID!) {
        participatingTeamsByLeague(idLeague: $id) {
            id
            group
            league {
                id
                name
            }
            team {
                id
                name
                logo
                club {
                    id
                    logo
                }
            }
        }
        calculatePoints(leagueId: $id) {
            team {
                id
                name
                logo
            }
            points
            matchesPlayed
            wins
            draws
            losses
            goalsFor
            goalsAgainst
            goalDifference
            group
        }
        calculateGoalPlayer(leagueId: $id) {
            team
            Goal
            PlayerID {
                id
                number
                player {
                    person {
                        first_name
                        second_name
                        third_name
                        tribe
                    }
                }
            }
        }
        getCardsByLeague(leagueId: $id) {
            yellowCards {
                player
                number
                count
                team {
                    id
                    name
                }
            }
            redCards {
                player
                number
                count
                team {
                    id
                    name
                }
            }
        }
        yellowCardAlerts(leagueId: $id) {
            player
            number
            yellowCount
            team {
                id
                name
            }
            matches {
                firstTeam
                secondTeam
                date
            }
        }
    }
`;

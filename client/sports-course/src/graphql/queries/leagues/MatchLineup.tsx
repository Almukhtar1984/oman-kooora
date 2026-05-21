import { gql } from "@apollo/client";

// Fetches both team lineups for a given match. Returns ParticipatingPlayersMatch
// rows annotated with the participating player + person, so the modal can
// render names and pre-check the current starter / sub state.
export const MatchLineup = gql`
    query MatchLineup($matchId: ID!) {
        getMatch(id: $matchId) {
            id
            firstTeamParticipatingPlayersMatch {
                id
                starter
                sub
                id_participating_player {
                    id
                    number
                    player {
                        id
                        player_center
                        person {
                            id
                            first_name
                            second_name
                            third_name
                            tribe
                            personal_picture
                        }
                    }
                }
            }
            secondTeamParticipatingPlayersMatch {
                id
                starter
                sub
                id_participating_player {
                    id
                    number
                    player {
                        id
                        player_center
                        person {
                            id
                            first_name
                            second_name
                            third_name
                            tribe
                            personal_picture
                        }
                    }
                }
            }
        }
    }
`;

import {gql} from "@apollo/client";

export const AllScorerMatch = gql`
    query AllScorerMatch($idMatch: ID) {
        allScorerMatch(idMatch: $idMatch) {
            id
            time
            participating_team {
                id
                team {
                    id
                    name
                }
            }
            participating_player {
                id
                number

                player {
                    id
                    player_center
                    person {
                        first_name
                        second_name
                        third_name
                        tribe
                    }
                }
            }
        }
    }
`;
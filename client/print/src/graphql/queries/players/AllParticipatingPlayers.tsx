import { gql } from "@apollo/client";

export const AllParticipatingPlayers = gql`
    query AllParticipatingPlayers($idParticipatingTeams: ID) {
        allParticipatingPlayers(idParticipatingTeams: $idParticipatingTeams) {
            id
            number
            participating_team {
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
                        name
                        logo
                    }
                }
            }
            player {
                id
                player_center
                person {
                    id
                    personal_picture
                    first_name
                    second_name
                    third_name
                    tribe
                    phone
                    card_number
                    date_birth
                }
            }
        }
    }
`;

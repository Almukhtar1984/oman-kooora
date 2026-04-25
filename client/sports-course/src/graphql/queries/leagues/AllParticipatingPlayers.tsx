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
                }
            }

            player {
                id
                activity
                player_center
                job
                status
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
            
            createdAt
            updatedAt
        }
    }
`;
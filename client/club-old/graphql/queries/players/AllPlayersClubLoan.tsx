import {gql} from "@apollo/client";

export const AllPlayersClubLoan = gql`
    query AllPlayersClubLoan($idClub: ID) {
        allPlayersClubLoaned(idClub: $idClub) {
            id
            activity
            player_center
            job
            status
            note
            class
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
            team {
                id
                name
                phone
            }
            lastLoan {
                id
                status
                transition_type
                date_start
                date_end

                team_from {
                    id
                    name
                    club {
                        id
                        name
                    }
                }
                team_to {
                    id
                    name
                }

                club_to {
                    id
                    name
                }
                
                id_player
                createdAt
                updatedAt
            }
            createdAt
            updatedAt
        }
    }
`;
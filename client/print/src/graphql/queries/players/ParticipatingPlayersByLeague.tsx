import { gql } from "@apollo/client";

export const ParticipatingPlayersByLeague = gql`
    query ParticipatingPlayersByLeague($idLeague: ID!) {
        participatingPlayersByLeague(idLeague: $idLeague) {
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
                type
                lastLoan {
                    status
                    transition_type
                    date_end
                    team_to {
                        id
                    }
                }
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

import { gql } from "@apollo/client";

export const AllParticipatingTechnicalStaff = gql`
    query AllParticipatingTechnicalStaff($idParticipatingTeams: ID) {
        allParticipatingTechnicalStaff(idParticipatingTeams: $idParticipatingTeams) {
            id
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
            technicalApparatus {
                id
                occupation
                classification
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

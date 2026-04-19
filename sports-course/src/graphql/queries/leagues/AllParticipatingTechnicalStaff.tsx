import {gql} from "@apollo/client";

export const AllParticipatingTechnicalStaff = gql`
    query AllParticipatingTechnicalStaff($idParticipatingTeams: ID) {
        allParticipatingTechnicalStaff(idParticipatingTeams: $idParticipatingTeams) {
            id
            startDate
            expiryDate
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

            technicalApparatus {
                id
                occupation
                classification
                membership_date
                membership_date_end
                paid
                testimony_experience
                status
                note

                team {
                    id
                    name
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
            
            createdAt
            updatedAt
        }
    }
`;
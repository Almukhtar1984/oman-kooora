import {gql} from "@apollo/client";

export const AllAssembly = gql`
    query AllAssembly($idClub: ID) {
        allAssemblyClub(idClub: $idClub) {
            id
            personal_picture
            first_name
            second_name
            third_name
            tribe
            date_birth
            card_number
            membership_number
            phone
            type
            nationalID
            nationalIDBack
            membership_date
            gender
            subscription_date

            club {
                id
                name
                logo
            }
            team {
                id
                name
                logo
            }
            affiliations {
                role
                status
                position
                team {
                    id
                    name
                    logo
                }
            }

            createdAt
        }
    }
`;
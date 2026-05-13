import {gql} from "@apollo/client";

export const AllTeamManagers = gql`
    query AllTeamManagers($idClub: ID) {
        allMembersClub(idClub: $idClub) {
            id
            occupation
            classification
            membership_date
            status
            createdAt
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
                user {
                    id
                    email
                    role
                    activation
                }
            }
            team {
                id
                name
                logo
                phone
            }
        }
    }
`;

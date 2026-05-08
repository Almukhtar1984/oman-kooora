import {gql} from "@apollo/client";

export const AllPermission = gql`
    query AllPermissions($idClub: ID) {
        allPermissionsClub(idClub: $idClub) {
            id
            
            teams
            members
            technicals
            players
            transfer_players
            loan_players
            assembly
            inbox
            outbox
            meeting
            blogs
            forms
            permissions
            leagues

            user {
                id
                email
                role
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

                    team {
                        id
                        name
                    }
                }
            }

            createdAt
            updatedAt
        }
    }
`;
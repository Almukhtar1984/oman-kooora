import {gql} from "@apollo/client";

export const AllClubs = gql`
    query AllClub {
        allClub {
            id
            name
            governorate
            logo
            phone
            account_status
            createdAt
            updatedAt

            admin {
                id
                email
                person {
                    id
                    personal_picture
                    first_name
                    second_name
                    third_name
                    tribe
                    clubManagement {
                        id
                    }
                }
            }
        }
    }
`;
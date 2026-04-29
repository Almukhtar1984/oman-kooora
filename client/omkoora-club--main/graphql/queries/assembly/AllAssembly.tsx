import {gql} from "@apollo/client";

export const AllAssembly = gql`
    query AllAssembly($idClub: ID) {
        allAssemblyClub(idClub: $idClub) {
            id
            first_name
            second_name
            third_name
            tribe
            date_birth
            card_number
            phone
            type
            nationalID
            membership_date
            gender
            subscription_date
            
            createdAt
            updatedAt
        }
    }
`;
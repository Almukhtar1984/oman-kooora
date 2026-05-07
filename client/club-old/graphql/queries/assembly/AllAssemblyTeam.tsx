import {gql} from "@apollo/client";

export const AllAssemblyTeam = gql`
    query AllAssemblyTeam($idTeam: ID) {
        allAssemblyTeam(idTeam: $idTeam) {
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
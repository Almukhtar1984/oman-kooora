import {gql} from "@apollo/client";

export const AllAssemblyTeam = gql`
    query AllAssemblyTeam($idTeam: ID, $withClubMembers: Boolean) {
        allAssemblyTeam(idTeam: $idTeam, withClubMembers: $withClubMembers) {
            id
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

            createdAt
            updatedAt
        }
    }
`;
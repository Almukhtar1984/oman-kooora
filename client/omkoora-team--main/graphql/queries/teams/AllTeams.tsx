import {gql} from "@apollo/client";

export const AllTeams = gql`
    query AllTeam($idClub: ID) {
        allTeam(idClub: $idClub) {
            id
            name
            logo
            phone
            manager_name
            activities
            account_status
            code
            enableAddPlayer
            createdAt
            updatedAt
        }
    }
`;
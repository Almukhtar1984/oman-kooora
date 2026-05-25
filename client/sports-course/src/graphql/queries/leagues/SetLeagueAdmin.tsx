import { gql } from "@apollo/client";

export const SetLeagueAdmin = gql`
    mutation SetLeagueAdmin($idLeague: ID!, $email: String!, $password: String) {
        setLeagueAdmin(idLeague: $idLeague, email: $email, password: $password) {
            id
            user {
                id
                email
            }
        }
    }
`;

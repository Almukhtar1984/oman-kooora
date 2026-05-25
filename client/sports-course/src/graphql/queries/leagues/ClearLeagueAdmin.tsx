import { gql } from "@apollo/client";

export const ClearLeagueAdmin = gql`
    mutation ClearLeagueAdmin($idLeague: ID!) {
        clearLeagueAdmin(idLeague: $idLeague) {
            status
        }
    }
`;

import {gql} from "@apollo/client";

export const ResetTeamPassword = gql`
    mutation ResetTeamPassword($idTeam: ID!) {
        resetTeamPassword(idTeam: $idTeam) {
            email
            password
        }
    }
`;

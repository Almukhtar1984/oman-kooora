import { gql } from "@apollo/client";

export const AiMatchCandidates = gql`
    query AiMatchCandidates($limit: Int, $id_team: ID, $id_club: ID) {
        aiMatchCandidates(limit: $limit, id_team: $id_team, id_club: $id_club) {
            id
            date
            stage
            league
            teamA
            teamB
            goalsA
            goalsB
            matchState
        }
    }
`;

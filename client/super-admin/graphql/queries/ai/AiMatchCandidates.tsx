import { gql } from "@apollo/client";

// Recent matches the owner / league admin can turn into news (newest first).
export const AI_MATCH_CANDIDATES = gql`
    query AiMatchCandidates($limit: Int) {
        aiMatchCandidates(limit: $limit) {
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

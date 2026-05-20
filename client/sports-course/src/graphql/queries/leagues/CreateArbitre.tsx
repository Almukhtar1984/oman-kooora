import { gql } from "@apollo/client";

export const CreateArbitre = gql`
    mutation CreateArbitre(
        $id_match: ID!
        $Arbitre1: String!
        $Arbitre2: String!
        $Arbitre3: String!
        $Arbitre4: String!
    ) {
        createArbitre(
            id_match: $id_match
            Arbitre1: $Arbitre1
            Arbitre2: $Arbitre2
            Arbitre3: $Arbitre3
            Arbitre4: $Arbitre4
        ) {
            id
            Arbitre1
            Arbitre2
            Arbitre3
            Arbitre4
            id_match
        }
    }
`;

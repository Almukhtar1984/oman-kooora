import {gql} from "@apollo/client";

export const DeleteMatchCard = gql`
    mutation DeleteMatchCard($id: ID!) {
        deleteMatchCard(id: $id) {
            status
        }
    }
`;
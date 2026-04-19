import {gql} from "@apollo/client";

export const UpdateStadium = gql`
    mutation UpdateStadium($id: ID!, $content: contentStadium!) {
        updateStadium(id: $id, content: $content) {
            status
        }
    }
`;
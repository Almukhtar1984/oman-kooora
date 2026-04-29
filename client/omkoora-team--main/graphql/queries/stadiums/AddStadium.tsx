import {gql} from "@apollo/client";

export const AddStadium = gql`
    mutation CreateStadium($content: contentStadium!) {
        createStadium(content: $content) {
            id
        }
    }
`;
import {gql} from "@apollo/client";

export const AddTechnical = gql`
    mutation CreateTechnical($content: contentTechnicalApparatus!) {
        createTechnicalApparatus(content: $content) {
            id
        }
    }
`;
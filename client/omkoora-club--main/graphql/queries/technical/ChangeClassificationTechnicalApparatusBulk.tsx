import {gql} from "@apollo/client";

export const ChangeClassificationTechnicalApparatusBulk = gql`
    mutation ChangeClassificationTechnicalApparatusBulk($ids: [ID!]!, $classification: String!) {
        changeClassificationTechnicalApparatusBulk(ids: $ids, classification: $classification) {
            success
            total
        }
    }
`;

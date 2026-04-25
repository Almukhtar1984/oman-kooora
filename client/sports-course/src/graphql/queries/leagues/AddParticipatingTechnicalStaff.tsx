import { gql } from "@apollo/client";

export const AddParticipatingTechnicalStaff = gql`
    mutation CreateParticipatingTechnicalStaff($content: [contentParticipatingTechnicalStaff]!) {
        createParticipatingTechnicalStaff(content: $content) {
            id
        }
    }
`;
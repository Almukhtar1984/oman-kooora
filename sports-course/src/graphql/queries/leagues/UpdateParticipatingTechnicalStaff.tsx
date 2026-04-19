import {gql} from "@apollo/client";

export const UpdateParticipatingTechnicalStaff = gql`
    mutation UpdateParticipatingTechnicalStaff($content: [contentUpdateParticipatingTechnicalStaff]!) {
        updateParticipatingTechnicalStaff(content: $content) {
            status
        }
    }
`;
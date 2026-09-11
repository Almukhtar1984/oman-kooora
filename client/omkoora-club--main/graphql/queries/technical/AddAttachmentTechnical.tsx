import {gql} from "@apollo/client";

export const AddAttachmentTechnical = gql`
    mutation AddAttachmentTechnical($idTechnical: ID!, $attachments: [Upload!]) {
        addAttachmentTechnical(idTechnical: $idTechnical, attachments: $attachments) {
            id
            content
        }
    }
`;

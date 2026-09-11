import {gql} from "@apollo/client";

export const DeleteAttachmentTechnical = gql`
    mutation DeleteAttachmentTechnical($id: ID!) {
        deleteAttachmentTechnical(id: $id) {
            status
        }
    }
`;

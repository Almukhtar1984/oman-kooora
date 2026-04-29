import {gql} from "@apollo/client";

export const DeleteAttachmentPlayer = gql`
    mutation DeleteAttachmentPlayer($id: ID!) {
        deleteAttachmentPlayer(id: $id) {
            status
        }
    }
`;
import {gql} from "@apollo/client";

export const AddAttachmentPlayer = gql`
    mutation AddAttachmentPlayer($idPlayer: ID!, $attachments: [Upload!]) {
        addAttachmentPlayer(idPlayer: $idPlayer, attachments: $attachments) {
            id
            content
        }
    }
`;
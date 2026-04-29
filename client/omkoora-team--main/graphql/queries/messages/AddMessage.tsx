import {gql} from "@apollo/client";

export const AddMessage = gql`
    mutation CreateMessage($content: contentMessage!) {
        createMessage(content: $content) {
            id
            subject
            content
            priority
            logo
            attachment {
                id
                content
            }

            club_sender {
                id
            }
            team_sender {
                id
            }
            team_receiver {
                id
            }
            
            createdAt
            updatedAt
        }
    }
`;
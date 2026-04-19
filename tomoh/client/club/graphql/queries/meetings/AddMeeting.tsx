import {gql} from "@apollo/client";

export const AddMeeting = gql`
    mutation CreateMeeting($content: contentMeeting!) {
        createMeeting(content: $content) {
            id
            subject
            names_attending
            description

            club {
                id
            }
            team {
                id
            }
            
            createdAt
            updatedAt
        }
    }
`;
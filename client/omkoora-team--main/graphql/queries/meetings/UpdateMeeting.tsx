import {gql} from "@apollo/client";

export const UpdateMeeting = gql`
    mutation UpdateMeeting($id: ID!, $content: contentMeeting!) {
        updateMeeting(id: $id, content: $content) {
            status
        }
    }
`;
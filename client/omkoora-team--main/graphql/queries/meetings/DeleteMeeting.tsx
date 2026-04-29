import {gql} from "@apollo/client";

export const DeleteMeeting = gql`
    mutation DeleteMeeting($id: ID!) {
        deleteMeeting(id: $id) {
            status
        }
    }
`;
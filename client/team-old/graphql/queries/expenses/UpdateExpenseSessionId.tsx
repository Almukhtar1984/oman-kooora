import { gql } from "@apollo/client";

export const UpdateSessionId = gql`
    mutation UpdateSessionId($id: ID!, $session_id: String!) {
        updateSessionId(id: $id, session_id: $session_id) {
            status
        }
    }
`;

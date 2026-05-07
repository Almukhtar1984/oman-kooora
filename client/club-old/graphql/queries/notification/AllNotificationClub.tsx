import {gql} from "@apollo/client";

export const AllNotificationClub = gql`
    query AllNotificationClub($idClub: ID!) {
        allNotificationClub(idClub: $idClub) {
            id
            body
            isRead
            createdAt
            deletedAt
            updatedAt
        }
    }
`;
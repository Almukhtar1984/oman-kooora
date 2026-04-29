import {gql} from "@apollo/client";

export const AllNotification= gql`
    query AllNotificationTeam($idTeam: ID!) {
        allNotificationTeam(idTeam: $idTeam) {
            id
            body
            isRead
            createdAt
            deletedAt
            updatedAt
                }
    }
`;
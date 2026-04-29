import {gql} from "@apollo/client";

export const MarkNotificationsAsRead = gql`
    mutation MarkNotificationsAsRead($idClub: ID, $idTeam: ID) {
        markNotificationsAsRead(idClub: $idClub, idTeam: $idTeam)
    }
`;

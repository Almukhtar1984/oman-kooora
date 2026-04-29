import {gql} from "@apollo/client";

export const AllMessagesSender = gql`
    query AllMessageSender($idClub: ID) {
        allMessageClubSender(idClub: $idClub) {
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
                name
            }

            createdAt
            updatedAt
        }
    }
`;
import {gql} from "@apollo/client";

export const AllMessageReceiver = gql`
    query AllMessageReceiver($idClub: ID) {
        allMessageClubReceiver(idClub: $idClub) {
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
                name
            }
            team_sender {
                id
                name
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
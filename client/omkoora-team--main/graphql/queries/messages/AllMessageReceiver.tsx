import {gql} from "@apollo/client";

export const AllMessageReceiver = gql`
    query AllMessageReceiver($idTeam: ID) {
        allMessageTeamReceiver(idTeam: $idTeam) {
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
            }
            team_receiver {
                id
            }

            createdAt
            updatedAt
        }
    }
`;
import {gql} from "@apollo/client";

export const AllMessagesSender = gql`
    query AllMessageSender($idTeam: ID) {
        allMessageTeamSender(idTeam: $idTeam) {
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
            }

            createdAt
            updatedAt
        }
    }
`;
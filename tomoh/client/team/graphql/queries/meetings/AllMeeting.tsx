import {gql} from "@apollo/client";

export const AllMeeting = gql`
    query AllMeetings($idTeam: ID) {
        allMeetingsTeam(idTeam: $idTeam) {
            id
            subject
            names_attending
            description
            attachment {
                id
                content
            }

            club {
                id
                name
            }
            team {
                id
                name
            }

            createdAt
            updatedAt
        }
    }
`;
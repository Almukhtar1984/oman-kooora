import {gql} from "@apollo/client";

export const AllMeeting = gql`
    query AllMeetings($idClub: ID) {
        allMeetingsClub(idClub: $idClub) {
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
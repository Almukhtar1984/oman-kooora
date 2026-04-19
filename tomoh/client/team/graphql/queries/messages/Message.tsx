import {gql} from "@apollo/client";

export const Message = gql`
    query Message($id: ID!) {
        message(id: $id) {
            id
            subject
            content
            priority
            logo
            attachment {
                id
                content
            }

            comment {
                id
                content
                note
                team {
                    id
                    logo
                    name
                }
                club {
                    id
                    logo
                    name
                }
            }

            club_sender {
                id
                logo
                name
            }
            team_sender {
                id
                logo
                name
            }
            team_receiver {
                id
                logo
                name
            }

            createdAt
            updatedAt
        }
    }
`;
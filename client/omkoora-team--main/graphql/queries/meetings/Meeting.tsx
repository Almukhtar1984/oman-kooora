import {gql} from "@apollo/client";

export const Meeting = gql`
    query Meeting($id: ID) {
        meeting(id: $id) {
            id
            subject
            names_attending
            description

#            club {
#                id
#                logo
#                name
#            }
#            team {
#                id
#                logo
#                name
#            }

            createdAt
            updatedAt
        }
    }
`;
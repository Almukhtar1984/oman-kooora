import {gql} from "@apollo/client";

export const AllStadium = gql`
    query AllStadiums {
        allStadiums {
            id
            name
            about
            type
            attachments
            rent
            images

            team {
                id
                name
                logo
            }

            createdAt
            updatedAt
        }
    }
`;
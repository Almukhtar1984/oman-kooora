import {gql} from "@apollo/client";

export const AllBlog = gql`
    query AllBlogs($idTeam: ID) {
        allBlogsTeam(idTeam: $idTeam) {
            id
            subject
            short_description
            description
            attachment {
                id
                content
            }

            club {
                id
                name
                logo
            }

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
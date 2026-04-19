import {gql} from "@apollo/client";

export const AllBlog = gql`
    query AllBlogs($idClub: ID) {
        allBlogsClub(idClub: $idClub) {
            id
            subject
            short_description
            description
            status
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
                club {
                    id
                    name
                    logo
                }
            }
            
            createdAt
            updatedAt
        }
    }
`;
import {gql} from "@apollo/client";

export const AllBlog = gql`
    query AllBlogs {
        allBlogs {
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
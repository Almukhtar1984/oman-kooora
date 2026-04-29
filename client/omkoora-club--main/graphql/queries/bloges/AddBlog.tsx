import {gql} from "@apollo/client";

export const AddBlog = gql`
    mutation CreateBlog($content: contentBlog!) {
        createBlog(content: $content) {
            id
            subject
            short_description
            description

            club {
                id
            }
            
            createdAt
            updatedAt
        }
    }
`;
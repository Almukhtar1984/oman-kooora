import { gql } from "@apollo/client";

export const Add_User_Image = gql`
    mutation AddUserImage($id: ID!, $image: Upload) {
        addPersonImage(id: $id, image: $image) {
            url
        }
    }
`;
import {gql} from "@apollo/client";

export const AllForm = gql`
    query AllForms($idClub: ID) {
        allForms(idClub: $idClub) {
            id
            subject
            file

            club {
                id
                name
                logo
            }

            createdAt
            updatedAt
        }
    }
`;
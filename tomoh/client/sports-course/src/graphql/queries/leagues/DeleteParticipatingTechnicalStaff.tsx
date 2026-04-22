import {gql} from "@apollo/client";

export const DeleteParticipatingTechnicalStaff = gql`
    mutation DeleteParticipatingTechnicalStaff($id: ID!) {
        deleteParticipatingTechnicalStaff(id: $id) {
            status
        }
    }
`;
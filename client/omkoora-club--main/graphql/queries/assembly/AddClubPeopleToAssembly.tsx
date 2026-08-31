import { gql } from "@apollo/client";

export const AddClubPeopleToAssembly = gql`
    mutation AddClubPeopleToAssembly($idClub: ID!) {
        addClubPeopleToAssembly(idClub: $idClub) {
            added
            skipped
            total
        }
    }
`;

import { gql } from "@apollo/client";

export const GenerateMatchNews = gql`
    mutation GenerateMatchNews($id_match: ID!, $publish: Boolean, $id_team: ID, $id_club: ID) {
        generateMatchNews(id_match: $id_match, publish: $publish, id_team: $id_team, id_club: $id_club) {
            id
            subject
            status
        }
    }
`;

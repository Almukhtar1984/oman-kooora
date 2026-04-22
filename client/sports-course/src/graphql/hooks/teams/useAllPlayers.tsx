import {useLazyQuery, gql} from "@apollo/client";

export const AllPlayers = gql`
    query AllPlayers($idTeam: ID) {
        allPlayers(idTeam: $idTeam) {
            id
            activity
            player_center
            job
            status
            person {
                id
                personal_picture
                first_name
                second_name
                third_name
                tribe
                phone
                card_number
                date_birth
            }
            
            createdAt
            updatedAt

        }
    }
`;

interface Props {}

export const useAllPlayers = () => {
    return useLazyQuery(AllPlayers);
};
import {gql} from "@apollo/client";

export const AllActionLogsClub = gql`
    query AllActionLogsClub($idClub: ID!) {
        allActionLogsClub(idClub: $idClub) {
            id
    id_player

    level
    action_name
    entity_type	
    entity_id
    action_type
    action_variables
    
    team{
        id
        name
        }
    user{
        id
        email
        person{
            id
            first_name
            second_name
            third_name
            tribe
            card_number
            }
        }
    createdAt
    deletedAt
    updatedAt
        }
    }
`;
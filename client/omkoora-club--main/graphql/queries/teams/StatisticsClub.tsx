import {gql} from "@apollo/client";

export const StatisticsClub = gql`
    query StatisticsClub($idClub: ID) {
        statisticsClub(idClub: $idClub) {
            numberTeams
            numberPlayers
            numberPlayersWaiting
            numberPlayersRejected
            numberPlayersAccepted
            numberTechnicales
            numberMembers
            numberStadiums
        }
    }
`;
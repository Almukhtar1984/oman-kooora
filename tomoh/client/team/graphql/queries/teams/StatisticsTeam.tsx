import {gql} from "@apollo/client";

export const StatisticsTeam = gql`
    query StatisticsTeam($idTeam: ID) {
        statisticsTeam(idTeam: $idTeam) {
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
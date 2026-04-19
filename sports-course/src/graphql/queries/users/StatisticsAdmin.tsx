import { gql } from "@apollo/client";

export const StatisticsAdmin = gql`
    query StatisticsAdmin($idAdmin: ID) {
        statisticsAdmin(idAdmin: $idAdmin) {
            totalRequest
            
            pendingRequest
            currentRequest
            expiredRequest
            rejectedRequest
            canceledRequest

            numberClients
            numberSupervisors
            numberEmployees
            numberProjects
        }
    }
`;
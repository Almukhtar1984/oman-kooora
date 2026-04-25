import { gql,useLazyQuery } from "@apollo/client";

const AllRequestsAdminWeekly = gql`
    query AllRequestsAdminWeekly($idAdmin: ID, $start: String, $end: String) {
        allRequestsAdminWeekly(idAdmin: $idAdmin, start: $start, end: $end) {
            day
            number
        }
    }
`;

const useAllRequestsWeekly = () => {
    return useLazyQuery(AllRequestsAdminWeekly);
};

export default useAllRequestsWeekly;

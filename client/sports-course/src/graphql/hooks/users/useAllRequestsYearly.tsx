import { gql,useLazyQuery } from "@apollo/client";

const AllRequestsAdminYearly = gql`
    query AllRequestsAdminYearly($idAdmin: ID, $start: String, $end: String) {
        allRequestsAdminYearly(idAdmin: $idAdmin, start: $start, end: $end) {
            month
            totalNumber
            expiredNumber
            canceledNumber
        }
    }
`;

const useAllRequestsYearly = () => {
    return useLazyQuery(AllRequestsAdminYearly);
};

export default useAllRequestsYearly;

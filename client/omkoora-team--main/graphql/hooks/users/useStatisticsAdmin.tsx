import {useLazyQuery, useQuery} from "@apollo/client";
import {StatisticsAdmin} from "../../"

interface Props {}

const useStatisticsAdmin = () => {
    return useLazyQuery(StatisticsAdmin);
};

export default useStatisticsAdmin;

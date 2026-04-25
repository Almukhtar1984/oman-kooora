import { useLazyQuery } from "@apollo/client";
import { StatisticsAdmin } from "../../";


const useStatisticsAdmin = () => {
    return useLazyQuery(StatisticsAdmin);
};

export default useStatisticsAdmin;

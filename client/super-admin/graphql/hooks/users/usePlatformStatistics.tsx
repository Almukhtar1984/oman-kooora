import { useQuery } from "@apollo/client";
import { PlatformStatistics } from "../../";

const usePlatformStatistics = () => {
    return useQuery(PlatformStatistics, { fetchPolicy: "cache-and-network" });
};

export default usePlatformStatistics;

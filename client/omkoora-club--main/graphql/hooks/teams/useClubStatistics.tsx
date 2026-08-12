import { useLazyQuery } from "@apollo/client";
import { ClubStatistics } from "../..";

export const useClubStatistics = () => useLazyQuery(ClubStatistics, { fetchPolicy: "cache-and-network" });

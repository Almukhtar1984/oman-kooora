import { useLazyQuery } from "@apollo/client";
import { AllTeams } from "../../";


export const useAllTeams = () => {
    return useLazyQuery(AllTeams);
};
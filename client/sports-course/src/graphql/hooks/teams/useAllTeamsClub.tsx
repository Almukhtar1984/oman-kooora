import { useLazyQuery } from "@apollo/client";
import { AllTeamsClub } from "../../";


export const useAllTeamsClub = () => {
    return useLazyQuery(AllTeamsClub);
};
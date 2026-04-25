import { useLazyQuery } from "@apollo/client";
import { AllClubs } from "../../";


export const useAllClub = () => {
    return useLazyQuery(AllClubs);
};
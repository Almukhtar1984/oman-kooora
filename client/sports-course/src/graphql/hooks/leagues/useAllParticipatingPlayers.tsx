import { useLazyQuery } from "@apollo/client";
import { AllParticipatingPlayers } from "../../";


export const useAllParticipatingPlayers = () => {
    return useLazyQuery(AllParticipatingPlayers);
};
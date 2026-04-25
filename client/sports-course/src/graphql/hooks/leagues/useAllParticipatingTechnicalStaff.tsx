import { useLazyQuery } from "@apollo/client";
import { AllParticipatingTechnicalStaff } from "../..";


export const useAllParticipatingTechnicalStaff = () => {
    return useLazyQuery(AllParticipatingTechnicalStaff);
};
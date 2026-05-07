import {useLazyQuery, useQuery} from "@apollo/client";
import {AllParticipatingTechnicalStaff} from "../.."

interface Props {}

export const useAllParticipatingTechnicalStaff = () => {
    return useLazyQuery(AllParticipatingTechnicalStaff);
};
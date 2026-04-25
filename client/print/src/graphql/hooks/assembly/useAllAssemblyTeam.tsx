import {useLazyQuery} from "@apollo/client";
import {AllAssemblyTeam} from "../../"

export const useAllAssemblyTeam = () => {
    return useLazyQuery(AllAssemblyTeam);
};
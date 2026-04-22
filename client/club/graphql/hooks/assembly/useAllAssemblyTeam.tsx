import {useLazyQuery} from "@apollo/client";
import {AllAssemblyTeam} from "../../"

interface Props {}

export const useAllAssemblyTeam = () => {
    return useLazyQuery(AllAssemblyTeam);
};
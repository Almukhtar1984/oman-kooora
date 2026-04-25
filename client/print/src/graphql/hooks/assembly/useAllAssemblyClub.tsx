import {useLazyQuery} from "@apollo/client";
import {AllAssemblyClub} from "../../"

export const useAllAssemblyClub = () => {
    return useLazyQuery(AllAssemblyClub);
};
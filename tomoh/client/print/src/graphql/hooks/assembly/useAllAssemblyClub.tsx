import {useLazyQuery} from "@apollo/client";
import {AllAssemblyClub} from "../../"

interface Props {}

export const useAllAssemblyClub = () => {
    return useLazyQuery(AllAssemblyClub);
};
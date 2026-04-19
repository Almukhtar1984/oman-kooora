import {useLazyQuery} from "@apollo/client";
import {AllAssembly} from "../../"

interface Props {}

export const useAllAssembly = () => {
    return useLazyQuery(AllAssembly);
};
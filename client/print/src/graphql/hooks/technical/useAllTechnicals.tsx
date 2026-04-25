import {useLazyQuery} from "@apollo/client";
import {AllTechnicals} from "../../"

export const useAllTechnicals = () => {
    return useLazyQuery(AllTechnicals);
};
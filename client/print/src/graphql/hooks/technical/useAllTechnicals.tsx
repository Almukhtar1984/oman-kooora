import {useLazyQuery, useQuery} from "@apollo/client";
import {AllTechnicals} from "../../"

interface Props {}

export const useAllTechnicals = () => {
    return useLazyQuery(AllTechnicals);
};
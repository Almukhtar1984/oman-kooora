import {useLazyQuery, useQuery} from "@apollo/client";
import {AllMembers, AllTechnicals} from "../../"

interface Props {}

export const useAllMembers = () => {
    return useLazyQuery(AllMembers);
};
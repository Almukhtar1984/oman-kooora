import {useLazyQuery} from "@apollo/client";
import {AllTeams} from "../../"

interface Props {}

export const useAllTeams = () => {
    return useLazyQuery(AllTeams);
};
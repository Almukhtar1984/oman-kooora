import {LazyQueryResultTuple, useLazyQuery} from "@apollo/client";
import {AllTeamManagers} from "../../";

interface Variables {
    idClub: string;
}

export const useAllTeamManagers = (): LazyQueryResultTuple<any, Variables> => {
    return useLazyQuery<any, Variables>(AllTeamManagers);
};

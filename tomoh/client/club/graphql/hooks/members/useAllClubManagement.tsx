import {LazyQueryResultTuple, useLazyQuery, useMutation} from "@apollo/client";
import {AllClubManagement} from "../.."


interface VariableProps {}

export const useAllClubManagement = (): LazyQueryResultTuple<any, VariableProps> => {
    return useLazyQuery<any, VariableProps>(AllClubManagement);
};
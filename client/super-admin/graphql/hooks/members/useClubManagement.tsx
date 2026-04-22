import {LazyQueryResultTuple, useLazyQuery, useMutation} from "@apollo/client";
import {ClubManagement} from "../../"


interface VariableProps {}

export const useClubManagement = (): LazyQueryResultTuple<any, VariableProps> => {
    return useLazyQuery<any, VariableProps>(ClubManagement);
};
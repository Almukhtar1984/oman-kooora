import {ApolloCache, DefaultContext, MutationTuple, OperationVariables, useMutation} from "@apollo/client";
import {LOG_OUT} from "../../"


interface Props {}

const useLogout = (): MutationTuple<any, OperationVariables, DefaultContext, ApolloCache<any>> => {
  return useMutation(LOG_OUT);
};

export default useLogout;

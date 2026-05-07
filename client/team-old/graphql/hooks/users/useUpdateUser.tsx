import {ApolloCache, DefaultContext, MutationTuple, useMutation} from "@apollo/client";
import {Update_User} from "../../"


interface VariableProps {
  id?: string;
  content: {
    email?: string;
    password?: string;
  };
}

const useUpdateUser = (): MutationTuple<any, VariableProps, DefaultContext, ApolloCache<any>> => {
  return useMutation<any, VariableProps>(Update_User);
};

export default useUpdateUser;

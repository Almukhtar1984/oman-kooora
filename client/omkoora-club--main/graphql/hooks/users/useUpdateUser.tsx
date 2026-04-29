import {ApolloCache, DefaultContext, MutationTuple, useMutation} from "@apollo/client";
import {Update_User} from "../../"


interface VariableProps {
  id?: string;
  content: {
    name?: string;
    password?: string;
    newPassword?: string;
    email?: string;
    phone?: string;
  };
}

const useUpdateUser = (): MutationTuple<any, VariableProps, DefaultContext, ApolloCache<any>> => {
  let res = useMutation<any, VariableProps>(Update_User);
  return res;
};

export default useUpdateUser;

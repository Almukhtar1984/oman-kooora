import {ApolloCache, DefaultContext, MutationTuple, useMutation,} from "@apollo/client";
import {Create_User} from "../../"

interface VariableProps {
  content: {
    email?: string;
    password?: string;
    role?: string;
    id_person?: string;
  };
}
const useCreateUser = (): MutationTuple<any, VariableProps, DefaultContext, ApolloCache<any>> => {
  return useMutation<any, VariableProps>(Create_User);
};

export default useCreateUser;

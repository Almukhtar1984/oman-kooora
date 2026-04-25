import { ApolloCache,DefaultContext,MutationTuple,useMutation } from "@apollo/client";
import { Create_User } from "../../";

interface VariableProps {
  content: {
    user_name?: string;
    password?: string;
    role?: string;
    person?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      address?: string;
      ID_number?: string;
    };
  };
}
const useCreateUser = (): MutationTuple<any, VariableProps, DefaultContext, ApolloCache<any>> => {
  let res = useMutation<any, VariableProps>(Create_User, {
    //   update: (cache, { data: { createBox } }) => {
    //     cache.modify({
    //       fields: {
    //         boxClient(existedBoxes = [], { readField }) {
    //           return [...existedBoxes, createBox];
    //         },
    //       },
    //     });
    //   },
  });
  return res;
};

export default useCreateUser;

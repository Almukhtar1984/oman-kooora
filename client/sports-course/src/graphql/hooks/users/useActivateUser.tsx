import { ApolloCache,DefaultContext,MutationTuple,useMutation } from "@apollo/client";
import { Active_User } from "../../";


interface VariableProps {
  idPerson?: string;
  activation?: string;
}

const useActivateUser = (): MutationTuple<any, VariableProps, DefaultContext, ApolloCache<any>> => {
  let res = useMutation<any, VariableProps>(Active_User, {
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

export default useActivateUser;

import {ApolloCache, DefaultContext, MutationTuple, useMutation} from "@apollo/client";
import {Delete_User} from "../../"


interface VariableProps {
  idPerson?: string;
}

const useDeleteUser = (): MutationTuple<any, VariableProps, DefaultContext, ApolloCache<any>> => {
  let res = useMutation<any, VariableProps>(Delete_User, {
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

export default useDeleteUser;

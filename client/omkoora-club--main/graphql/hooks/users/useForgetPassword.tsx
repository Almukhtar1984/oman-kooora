import {ApolloCache, DefaultContext, gql, MutationTuple, useMutation} from "@apollo/client";
import {FORGET_PW} from "../../"


interface VariableProps {
  email?: string;
}

const useForgetPassword = (): MutationTuple<
  any,
  VariableProps,
  DefaultContext,
  ApolloCache<any>
> => {
  let ForgetPassword = useMutation<any, VariableProps>(FORGET_PW, {
    // refetchQueries: [ALL_BRANDS],
    // update: (cache, { data /* : { editBox } */ }) => {
    //   // cache.modify({
    //   //   fields: {
    //   //     allProduct(existedProducts = [], { readField }) {
    //   //       return [...existedProducts, editBox];
    //   //     },
    //   //   },
    //   // });
    // },
  });
  return ForgetPassword;
};

export default useForgetPassword;

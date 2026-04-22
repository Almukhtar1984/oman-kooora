import {OperationVariables, QueryTuple, useLazyQuery,} from "@apollo/client";
import {REFRESH_TOKEN} from "../../"


interface Props {}

const UseGetNewToken = (): QueryTuple<any, OperationVariables> => {
  let useGetNewTokenResult = useLazyQuery(REFRESH_TOKEN);
  return useGetNewTokenResult;
};

export default UseGetNewToken;

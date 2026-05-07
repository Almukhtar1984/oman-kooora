import { gql, OperationVariables, QueryTuple, useLazyQuery, useQuery } from "@apollo/client";
import {ALL_USERS} from "../../"

interface Props {}

const useGetAllUsers = () => {
  let { data, loading, refetch } = useQuery(ALL_USERS);
  return [data?.allUsers || [], loading, refetch];
};

export default useGetAllUsers;

import { gql, useQuery } from "@apollo/client";
import {all_Formats} from "../../"

interface Props {}

const useGetTemplatesForUsers = (/* { id }: { id?: string } */) => {
  let { data, loading, refetch } = useQuery(all_Formats, {
    // variables: {
    //   sickId: id,
    // },
    // fetchPolicy: "cache-first",
    // nextFetchPolicy: "cache-first",
  });
  return [data?.allFormats || [], loading, refetch];
};

export default useGetTemplatesForUsers;

import {OperationVariables, QueryTuple, useLazyQuery} from "@apollo/client";
import {REFRESH_TOKEN} from "../../"
import {client} from "../../../lib/graphql"

interface Props {}

const getNewToken = async () => {
  return await client.query({
    query: REFRESH_TOKEN
  });
};

export default getNewToken;
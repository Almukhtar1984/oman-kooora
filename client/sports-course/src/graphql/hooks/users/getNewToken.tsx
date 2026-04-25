import { REFRESH_TOKEN } from "../../";
import { client } from "../../../lib/graphql";


const getNewToken = async () => {
  return await client.query({
    query: REFRESH_TOKEN
  });
};

export default getNewToken;
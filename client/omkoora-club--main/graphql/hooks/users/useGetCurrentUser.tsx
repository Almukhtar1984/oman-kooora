import { useLazyQuery } from "@apollo/client";
import {CURRENT_USER} from "../../"

interface Props {}

const UseGetCurrentUser = () => {
  let currentUserResult = useLazyQuery(CURRENT_USER);
  return currentUserResult;
};

export default UseGetCurrentUser;

import {useLazyQuery} from "@apollo/client";
import {Member} from "../.."

export const useMember = () => {
    return useLazyQuery(Member);
};
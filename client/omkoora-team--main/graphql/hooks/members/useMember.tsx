import {useLazyQuery} from "@apollo/client";
import {Member} from "../../"

interface Props {}

export const useMember = () => {
    return useLazyQuery(Member);
};
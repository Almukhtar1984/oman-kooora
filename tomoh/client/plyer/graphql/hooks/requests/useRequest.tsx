import {useLazyQuery} from "@apollo/client";
import {Request} from "../../"

interface Props {}

export const useRequest = () => {
    return useLazyQuery(Request);
};
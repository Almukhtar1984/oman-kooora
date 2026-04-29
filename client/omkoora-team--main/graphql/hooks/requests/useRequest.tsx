import {useLazyQuery} from "@apollo/client";
import {Request} from "../../queries";

interface Props {}

export const useRequest = () => {
    return useLazyQuery(Request);
};
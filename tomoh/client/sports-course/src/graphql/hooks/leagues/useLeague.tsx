import {useLazyQuery} from "@apollo/client";
import {League} from "../../"

interface Props {}

export const useLeague = () => {
    return useLazyQuery(League);
};
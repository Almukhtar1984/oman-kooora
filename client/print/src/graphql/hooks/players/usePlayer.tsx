import {useLazyQuery} from "@apollo/client";
import {Player} from "../../"

export const usePlayer = () => {
    return useLazyQuery(Player);
};
import {useLazyQuery} from "@apollo/client";
import {Player} from "../../"

interface Props {}

export const usePlayer = () => {
    return useLazyQuery(Player);
};
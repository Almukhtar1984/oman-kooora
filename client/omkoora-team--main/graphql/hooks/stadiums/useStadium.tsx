import {useLazyQuery} from "@apollo/client";
import {Stadium} from "../../queries"

interface Props {}

export const useStadium = () => {
    return useLazyQuery(Stadium);
};
import {useLazyQuery} from "@apollo/client";
import {AllStadium} from "../../queries"

interface Props {}

export const useAllStadium = () => {
    return useLazyQuery(AllStadium);
};
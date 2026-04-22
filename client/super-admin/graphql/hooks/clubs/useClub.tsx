import {useLazyQuery} from "@apollo/client";
import {Club} from "../../"

interface Props {}

export const useClub = () => {
    return useLazyQuery(Club);
};
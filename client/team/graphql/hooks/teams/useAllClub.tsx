import {useLazyQuery} from "@apollo/client";
import {AllClubs} from "../../"

interface Props {}

export const useAllClub = () => {
    return useLazyQuery(AllClubs);
};
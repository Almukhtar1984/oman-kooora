import { useQuery } from "@apollo/client";
import {AllClubs} from "../../"

interface Props {}

export const useAllClubs = () => {
    return useQuery(AllClubs);
};
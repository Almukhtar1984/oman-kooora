import {useLazyQuery} from "@apollo/client";
import {Team} from "../../"

interface Props {}

export const useTeam = () => {
    return useLazyQuery(Team);
};
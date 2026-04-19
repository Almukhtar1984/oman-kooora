import {useLazyQuery} from "@apollo/client";
import {AllTeamsClub} from "../../"

interface Props {}

export const useAllTeamsClub = () => {
    return useLazyQuery(AllTeamsClub);
};
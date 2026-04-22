import {useLazyQuery, useQuery} from "@apollo/client";
import {AllParticipatingPlayers} from "../../"

interface Props {}

export const useAllParticipatingPlayers = () => {
    return useLazyQuery(AllParticipatingPlayers);
};
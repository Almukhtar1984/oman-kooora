import { useLazyQuery } from "@apollo/client";
import { ParticipatingPlayersByLeague } from "../../";

export const useParticipatingPlayersByLeague = () => {
    return useLazyQuery(ParticipatingPlayersByLeague);
};

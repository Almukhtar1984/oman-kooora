import { useLazyQuery } from "@apollo/client";
import { CardsByLeague } from "../..";

export const useCardsByLeague = () => {
    return useLazyQuery(CardsByLeague);
};

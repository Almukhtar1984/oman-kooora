import { GetCardsByLeague } from "../.."; // Adjust the path if needed
import { useLazyQuery } from "@apollo/client";

export const useCardsByLeague = () => {
  return useLazyQuery(GetCardsByLeague);
};

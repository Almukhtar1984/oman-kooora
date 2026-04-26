import { useLazyQuery } from "@apollo/client";
import { CountExternalPlayers } from "../../";

interface Props {}

export const useCountExternalPlayers = () => {
  return useLazyQuery(CountExternalPlayers);
};
import { useLazyQuery } from "@apollo/client";
import { TopGoal } from "../..";

export const useTopGoal = () => {
    return useLazyQuery(TopGoal);
};

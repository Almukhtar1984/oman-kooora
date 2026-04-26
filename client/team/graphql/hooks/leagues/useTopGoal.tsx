
import {TopGoal} from "../.."

import {useLazyQuery, useQuery} from "@apollo/client";



interface Props {}

export const useTopGoal= () => {
    return useLazyQuery(TopGoal);
};
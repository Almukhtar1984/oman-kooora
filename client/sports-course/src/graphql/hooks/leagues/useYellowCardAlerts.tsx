import { useLazyQuery } from "@apollo/client";
import { YellowCardAlerts } from "../..";

export const useYellowCardAlerts = () => {
    return useLazyQuery(YellowCardAlerts);
};

import {useLazyQuery} from "@apollo/client";
import {AllNotificationClub} from "../.."

interface Props {}

export const useAllNotificationClub = () => {
    return useLazyQuery(AllNotificationClub);
};
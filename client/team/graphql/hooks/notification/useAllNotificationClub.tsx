import {useLazyQuery} from "@apollo/client";
import {AllNotification} from "../.."

interface Props {}

export const useAllNotification = () => {
    return useLazyQuery(AllNotification);
};
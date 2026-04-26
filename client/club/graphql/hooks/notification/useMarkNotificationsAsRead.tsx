import {useMutation} from "@apollo/client";
import {MarkNotificationsAsRead} from "../.."

export const useMarkNotificationsAsRead = () => {
    return useMutation(MarkNotificationsAsRead);
};

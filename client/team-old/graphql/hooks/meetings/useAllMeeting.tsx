import {useLazyQuery} from "@apollo/client";
import {AllMeeting} from "../../"

interface Props {}

export const useAllMeeting = () => {
    return useLazyQuery(AllMeeting);
};
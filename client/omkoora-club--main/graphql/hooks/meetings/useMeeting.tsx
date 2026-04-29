import {useLazyQuery} from "@apollo/client";
import {Meeting} from "../../"

interface Props {}

export const useMeeting = () => {
    return useLazyQuery(Meeting);
};
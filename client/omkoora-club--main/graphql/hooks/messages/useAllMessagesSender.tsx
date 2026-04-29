import {useLazyQuery} from "@apollo/client";
import {AllMessagesSender} from "../../"

interface Props {}

export const useAllMessagesSender = () => {
    return useLazyQuery(AllMessagesSender);
};
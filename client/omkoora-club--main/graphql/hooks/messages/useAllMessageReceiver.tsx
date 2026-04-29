import {useLazyQuery} from "@apollo/client";
import {AllMessageReceiver} from "../../"

interface Props {}

export const useAllMessageReceiver = () => {
    return useLazyQuery(AllMessageReceiver);
};
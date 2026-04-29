import {useLazyQuery} from "@apollo/client";
import {Message} from "../../"

interface Props {}

export const useMessage = () => {
    return useLazyQuery(Message);
};
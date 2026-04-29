import {useLazyQuery} from "@apollo/client";
import {AllForm} from "../../"

interface Props {}

export const useAllForm = () => {
    return useLazyQuery(AllForm);
};
import {useLazyQuery} from "@apollo/client";
import {Technical} from "../../"

interface Props {}

export const useTechnical = () => {
    return useLazyQuery(Technical);
};
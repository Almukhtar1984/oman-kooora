import {useLazyQuery} from "@apollo/client";
import {Technical} from "../..";

export const useTechnical = () => {
    return useLazyQuery(Technical);
};

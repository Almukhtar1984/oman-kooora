import {useLazyQuery} from "@apollo/client";
import {Blog} from "../../"

interface Props {}

export const useBlog = () => {
    return useLazyQuery(Blog);
};
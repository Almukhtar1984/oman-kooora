import {useLazyQuery} from "@apollo/client";
import {AllBlog} from "../../"

interface Props {}

export const useAllBlog = () => {
    return useLazyQuery(AllBlog);
};
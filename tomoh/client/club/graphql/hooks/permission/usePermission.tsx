import {useLazyQuery} from "@apollo/client";
import {Permission} from "../.."

interface Props {}

export const usePermission = () => {
    return useLazyQuery(Permission);
};
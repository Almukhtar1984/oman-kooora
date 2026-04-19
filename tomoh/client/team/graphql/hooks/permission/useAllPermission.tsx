import {useLazyQuery} from "@apollo/client";
import {AllPermission} from "../.."

interface Props {}

export const useAllPermission = () => {
    return useLazyQuery(AllPermission);
};
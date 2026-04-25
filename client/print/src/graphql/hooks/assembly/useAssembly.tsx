import {useLazyQuery} from "@apollo/client";
import {Assembly} from "../.."

export const useAssembly = () => {
    return useLazyQuery(Assembly);
};
import {useLazyQuery} from "@apollo/client";
import {Assembly} from "../.."

interface Props {}

export const useAssembly = () => {
    return useLazyQuery(Assembly);
};
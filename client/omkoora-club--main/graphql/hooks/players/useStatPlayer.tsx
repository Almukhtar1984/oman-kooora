import { useLazyQuery } from "@apollo/client";
import { statPlayer } from "../../queries"; // Adjust the path as necessary

interface Props {}

export const useStatPlayer = () => {
    return useLazyQuery(statPlayer);
};
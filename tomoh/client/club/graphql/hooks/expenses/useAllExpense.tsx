import {useLazyQuery} from "@apollo/client";
import {AllExpense} from "../../"

interface Props {}

export const useAllExpense = () => {
    return useLazyQuery(AllExpense);
};
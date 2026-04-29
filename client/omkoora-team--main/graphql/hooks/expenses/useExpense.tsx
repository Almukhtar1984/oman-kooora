import {useLazyQuery} from "@apollo/client";
import {Expense} from "../../"

interface Props {}

export const useExpense = () => {
    return useLazyQuery(Expense);
};
import { useLazyQuery } from "@apollo/client";
import { ExpenseSummary } from "../../";

interface Props {}

export const useExpenseSummary = () => {
    return useLazyQuery(ExpenseSummary);
};

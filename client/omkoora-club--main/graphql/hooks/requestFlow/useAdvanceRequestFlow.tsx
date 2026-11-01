import { MutationTuple, useMutation } from "@apollo/client";
import { AdvanceRequestFlow } from "../../";

interface VariableProps {
    id: string;
    to: string;
    reason?: string | null;
    amount?: number | null;
}

export const useAdvanceRequestFlow = (): MutationTuple<any, VariableProps> => {
    // القرار ينقص عدّاد «الطلبات» على الشريط، فيُقرأ بعده لا بعد دقيقة.
    return useMutation<any, VariableProps>(AdvanceRequestFlow, { refetchQueries: ["ClubPendingRequests"] });
};

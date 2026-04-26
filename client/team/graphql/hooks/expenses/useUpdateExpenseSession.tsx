import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateSessionId} from "../../"


interface VariableProps {
    id: string;
    session_id: string;
}


export const useUpdateExpenseSessionid = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateSessionId);
};
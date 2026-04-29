import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteMeeting} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteMeeting = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteMeeting);
};
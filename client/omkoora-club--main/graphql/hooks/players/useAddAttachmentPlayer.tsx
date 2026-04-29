import {MutationTuple, useMutation} from "@apollo/client";
import {AddAttachmentPlayer} from "../../"


interface VariableProps {
    attachments?: any;

    idPlayer?: string;
}

export const useAddAttachmentPlayer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddAttachmentPlayer);
};

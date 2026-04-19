import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateMessage} from "../../"


interface VariableProps {
    id?:          string;
    content: {
        subject:               string;
        content:               string;
        priority:              string;
        logo?:                 any
        attachment?:           any
    }
}

export const useUpdateMessage = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateMessage);
};
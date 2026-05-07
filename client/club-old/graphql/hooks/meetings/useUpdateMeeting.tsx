import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateMeeting} from "../../"


interface VariableProps {
    id?:          string;
    content: {
        subject:       string;
        names_attending:       string;
        description?:       string;
        attachment?:       any;
    }
}

export const useUpdateMeeting = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateMeeting);
};
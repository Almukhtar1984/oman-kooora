import {MutationTuple, useMutation} from "@apollo/client";
import {AddMeeting} from "../../"


interface VariableProps {
    content: {
        subject:       string;
        names_attending:       string;
        description?:       string;

        attachment?:       any;
        id_club?:   string;
        id_team?:   string;


    };
}

export const useAddMeeting = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddMeeting);
};
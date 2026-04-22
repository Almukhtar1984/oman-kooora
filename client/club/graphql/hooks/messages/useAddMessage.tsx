import {MutationTuple, useMutation} from "@apollo/client";
import {AddMessage} from "../../"


interface VariableProps {
    content: {
        subject:               string;
        content:               string;
        priority:              string;
        logo?:                 any
        attachment?:           any
        id_club_sender:        string;
        id_team_sender:        string;
        id_team_receiver:      string;
    };
}

export const useAddMessage = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddMessage);
};
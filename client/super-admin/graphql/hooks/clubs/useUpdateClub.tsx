import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateClub} from "../../"


interface VariableProps {
    id?:          string;
    content: {
        name:           string;
        governorate:    string;
        logo?:           any
        phone:          string;
    }
}

export const useUpdateClub = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateClub);
};
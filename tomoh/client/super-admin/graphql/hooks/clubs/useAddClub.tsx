import {MutationTuple, useMutation} from "@apollo/client";
import {AddClub} from "../../"


interface VariableProps {
    content: {
        name:           string;
        governorate:    string;
        logo?:           any
        phone:          string;
    };
}

export const useAddClub = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddClub);
};

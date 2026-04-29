import {MutationTuple, useMutation} from "@apollo/client";
import {AddBlog} from "../../"


interface VariableProps {
    content: {
        subject:       string;
        short_description:       string;
        description?:       string;

        attachment?:       any;
        id_team?:   string;
    };
}

export const useAddBlog = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddBlog);
};
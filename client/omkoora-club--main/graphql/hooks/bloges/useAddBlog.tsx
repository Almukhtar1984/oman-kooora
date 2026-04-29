import {MutationTuple, useMutation} from "@apollo/client";
import {AddBlog} from "../../"


interface VariableProps {
    content: {
        subject:       string;
        short_description:       string;
        description?:       string;

        status?:       string;
        attachment?:       any;
        id_club?:   string;
    };
}

export const useAddBlog = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddBlog);
};
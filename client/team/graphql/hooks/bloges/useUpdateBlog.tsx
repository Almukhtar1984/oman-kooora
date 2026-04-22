import {MutationTuple, useMutation} from "@apollo/client";
import {UpdateBlog} from "../../"


interface VariableProps {
    id?:          string;
    content: {
        subject:       string;
        short_description:       string;
        description?:       string;
        attachment?:       any;
    }
}

export const useUpdateBlog = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(UpdateBlog);
};
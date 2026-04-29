import {MutationTuple, useMutation} from "@apollo/client";
import {DeleteBlog} from "../../"


interface VariableProps {
    id?: string;
}

export const useDeleteBlog = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeleteBlog);
};
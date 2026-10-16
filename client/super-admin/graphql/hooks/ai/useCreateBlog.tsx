import { MutationTuple, useMutation } from "@apollo/client";
import { CREATE_BLOG } from "../../";

interface VariableProps {
    content: {
        subject: string;
        short_description: string;
        description?: string;
        status?: string;       // waiting | accepted | rejected
        category?: string;
        author_name?: string;
        id_club?: string;
        id_team?: string;
    };
}

export const useCreateBlog = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(CREATE_BLOG);
};

import { MutationTuple, useMutation } from "@apollo/client";
import { DeletePerson } from "../../";

interface VariableProps {
    id?: string;
}

 const useDeletePerson = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(DeletePerson);
};

export default useDeletePerson;
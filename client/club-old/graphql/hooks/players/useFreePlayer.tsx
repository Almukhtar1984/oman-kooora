import { MutationTuple, useMutation } from "@apollo/client";
import { FreePlayer } from "../../"; 

interface VariableProps {
  id?: string;
}

export const useFreePlayer = (): MutationTuple<any, VariableProps> => {
  return useMutation<any, VariableProps>(FreePlayer);
};

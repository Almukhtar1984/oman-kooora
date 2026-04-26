import { MutationTuple, useMutation } from "@apollo/client";
import { UploadPlayersSheet } from "../../"; // adjust path as needed

interface VariableProps {
  teamId: string;
  file: any; // type is File or Upload, depending on your setup
}

export const useUploadPlayersSheet = (): MutationTuple<any, VariableProps> => {
  return useMutation<any, VariableProps>(UploadPlayersSheet);
};

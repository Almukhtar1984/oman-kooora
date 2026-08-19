import { MutationTuple, useMutation } from "@apollo/client";
import { UploadAssemblySheet } from "../../";

interface VariableProps {
  idClub: string;
  file: any;
}

export const useUploadAssemblySheet = (): MutationTuple<any, VariableProps> => {
  return useMutation<any, VariableProps>(UploadAssemblySheet);
};

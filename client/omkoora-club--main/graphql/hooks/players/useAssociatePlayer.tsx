import { MutationTuple, useMutation } from "@apollo/client";
import { AssociatePlayer } from "../../";

interface VariableProps {
  id_player: string;
  id_team: string;
}

export const useAssociatePlayer = (): MutationTuple<any, VariableProps> => {
  return useMutation<any, VariableProps>(AssociatePlayer);
};

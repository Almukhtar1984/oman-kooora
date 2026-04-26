import { MutationTuple, useMutation } from "@apollo/client";
import { ConvertTechnicalToPlayer } from "../../";

interface VariableProps {
    idTechnical: string;
    activity: string;
    player_center: string;
    class: string;
}

export const useConvertTechnicalToPlayer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(ConvertTechnicalToPlayer);
};

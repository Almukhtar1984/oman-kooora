import { useLazyQuery } from "@apollo/client";
import { SanctionLast } from "../../";  // Adjust the import path as necessary

interface VariableProps {
    id_player: string;
}

interface Sanction {
    id: string;
    note: string;
    date_from: string;
    date_to: string;
    player: {
        id: string;
        person: {
            first_name: string;
            second_name: string;
            third_name: string;
        };
    };
}

export const useSanctionLast = () => {
    return useLazyQuery<{ SanctionLast: Sanction }, VariableProps>(SanctionLast);
};

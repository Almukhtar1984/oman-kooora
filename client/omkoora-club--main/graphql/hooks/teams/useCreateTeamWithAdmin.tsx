import {MutationTuple, useMutation} from "@apollo/client";
import {CreateTeamWithAdmin} from "../../";

interface VariableProps {
    team: {
        name: string;
        category?: number;
        logo?: any;
        phone: string;
        manager_name: string;
        activities: string;
        code: string;
        id_club: string;
    };
    manager: {
        email: string;
        password: string;
        occupation?: string;
        classification?: string;
        membership_date?: string;
        membership_date_end?: string;
        person: {
            first_name: string;
            second_name: string;
            third_name?: string;
            tribe: string;
            phone: string;
            card_number: string;
            date_birth: string;
        };
    };
}

export const useCreateTeamWithAdmin = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(CreateTeamWithAdmin);
};

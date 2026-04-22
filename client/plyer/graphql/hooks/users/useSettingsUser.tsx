import {ApolloCache, DefaultContext, MutationTuple, useMutation} from "@apollo/client";
import {SettingsUser} from "../../"


interface VariableProps {
    id?: string;
    content: {
        person: {
            first_name?:    string;
            second_name?:   string;
            third_name?:    string;
            tribe?:         string;
            phone?:         string;
            card_number?:   string;
            date_birth?:    string;
        };

        email?:             string;
        password?:          string;
    };
}

const useSettingsUser = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(SettingsUser);
};

export default useSettingsUser;

import {ApolloCache, DefaultContext, MutationTuple, useMutation} from "@apollo/client";
import {SettingsUser} from "../../"


interface VariableProps {
    id?: string;
    content: {
        display_language?: string;
        notifications?: boolean;
    };
}

const useSettingsUser = (): MutationTuple<any, VariableProps, DefaultContext, ApolloCache<any>> => {
    return useMutation<any, VariableProps>(SettingsUser);
};

export default useSettingsUser;

import {MutationTuple, gql, useMutation} from "@apollo/client";

const AddListPlayer = gql`
    mutation CreateListPlayer($content: [contentPlayer!]) {
        createListPlayer(content: $content) {
            id
        }
    }
`;

interface VariableProps {
    content: {
        activity?: string;
        player_center?: string;
        job?: string;
        class?: string;

        person: {
            first_name?: string;
            second_name?: string;
            third_name?: string;
            tribe?: string;
            phone?: string;
            card_number?: string;
            date_birth?: string;
        }
        id_team?: string;
    }[];
}

export const useAddListPlayer = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(AddListPlayer);
};
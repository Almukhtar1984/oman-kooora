import {MutationTuple, useMutation} from "@apollo/client";
import {Add_User_Image} from "../../"


interface VariableProps {
    id?: string;
    image?: any;
}

const useAddUserImage = (): MutationTuple<any, VariableProps> => {
    return useMutation<any, VariableProps>(Add_User_Image);
};

export default useAddUserImage;


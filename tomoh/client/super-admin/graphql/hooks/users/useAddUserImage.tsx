import {MutationTuple, useMutation} from "@apollo/client";
import {Add_User_Image} from "../../"


interface VariableProps {
    id?: string;
    image?: any;
}

const useAddUserImage = (): MutationTuple<any, VariableProps> => {
    let res = useMutation<any, VariableProps>(Add_User_Image);
    return res;
};

export default useAddUserImage;


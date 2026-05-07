import {useLazyQuery} from "@apollo/client";
import {Form} from "../../"

interface Props {}

export const useForm = () => {
    return useLazyQuery(Form);
};
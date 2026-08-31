import {useMutation} from "@apollo/client";
import {CreateMemberPayment} from "../../";

export const useCreateMemberPayment = () => {
    return useMutation(CreateMemberPayment);
};

import {useMutation} from "@apollo/client";
import {DeleteMemberPayment} from "../../";

export const useDeleteMemberPayment = () => {
    return useMutation(DeleteMemberPayment);
};

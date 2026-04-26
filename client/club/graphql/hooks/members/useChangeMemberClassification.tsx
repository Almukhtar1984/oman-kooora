import {useMutation} from "@apollo/client";
import {ChangeMemberClassification} from "../../queries/members";

export const useChangeMemberClassification = () => {
    return useMutation(ChangeMemberClassification);
};

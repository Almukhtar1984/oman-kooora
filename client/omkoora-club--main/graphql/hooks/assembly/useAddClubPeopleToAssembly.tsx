import { useMutation } from "@apollo/client";
import { AddClubPeopleToAssembly } from "../../";

export const useAddClubPeopleToAssembly = () => {
    return useMutation(AddClubPeopleToAssembly);
};

import {useLazyQuery, gql} from "@apollo/client";
import {GetPerson} from "../../queries";


const useGetPerson = () => {
    return useLazyQuery(GetPerson);
};

export default useGetPerson;

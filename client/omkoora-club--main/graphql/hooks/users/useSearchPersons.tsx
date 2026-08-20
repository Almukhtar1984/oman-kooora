import { useLazyQuery } from "@apollo/client";
import { SearchPersons } from "../../queries";

const useSearchPersons = () => {
  return useLazyQuery(SearchPersons, { fetchPolicy: "no-cache" });
};

export default useSearchPersons;

import { useLazyQuery, useMutation } from "@apollo/client";
import { AUTHENTICATE_PORTAL_PERSON, PORTAL_ME, PORTAL_PAYMENTS } from "../../queries/portal";

export const useAuthenticatePortalPerson = () => useMutation(AUTHENTICATE_PORTAL_PERSON);

export const usePortalMe = () => useLazyQuery(PORTAL_ME, { fetchPolicy: "cache-and-network" });

export const usePortalPayments = () => useLazyQuery(PORTAL_PAYMENTS, { fetchPolicy: "cache-and-network" });

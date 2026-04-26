import { useMutation, useQuery, useLazyQuery } from "@apollo/client";
import { ALL_EVENTS, CREATE_EVENT, UPDATE_EVENT, DELETE_EVENT } from "../../queries/events/Event";

export const useAllEvents = () => {
    return useLazyQuery(ALL_EVENTS, { fetchPolicy: "network-only" });
};

export const useCreateEvent = () => {
    return useMutation(CREATE_EVENT);
};

export const useUpdateEvent = () => {
    return useMutation(UPDATE_EVENT);
};

export const useDeleteEvent = () => {
    return useMutation(DELETE_EVENT);
};

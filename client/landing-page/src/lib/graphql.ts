import {ApolloClient, from, fromPromise, InMemoryCache} from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import {apiUrl} from "./config";

const authLink = setContext((_, { headers, operationName }) => {
    return {
        headers: {
            ...headers,
            "x-apollo-operation-name": operationName,
            "apollo-require-preflight": true,
        },
    };
});
let isRefreshing: boolean;
let pendingRequests: Function[] = [];

const resolvePendingRequests = () => {
    pendingRequests.map((callback) => callback());
    pendingRequests = [];
};

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {

    if (graphQLErrors && process.env.NODE_ENV !== "production") {
        const { extensions, path, message, locations } = graphQLErrors[0];

        console.warn(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    }
});

const httpLink = createUploadLink({
    uri: `${apiUrl}/graphql`,
    credentials: "include",
});

export const client = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    credentials: "include"
});

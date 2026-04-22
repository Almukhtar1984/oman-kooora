import {ApolloClient, from, createHttpLink, InMemoryCache} from "@apollo/client";
import { onError } from "@apollo/client/link/error";

import {apiUrl} from "../config";

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {

    if (graphQLErrors && process.env.NODE_ENV !== "production") {
        const { path, message, locations } = graphQLErrors[0];

        console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    }
});

const httpLink = createHttpLink({
    uri: `${apiUrl}/graphql`,
    credentials: "include",
});

export const client = new ApolloClient({
    link: from([errorLink, httpLink]),
    cache: new InMemoryCache(),
    credentials: "include"
});

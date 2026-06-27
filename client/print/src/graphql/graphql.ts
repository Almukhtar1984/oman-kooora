import {ApolloClient, from, createHttpLink, InMemoryCache} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";

import {apiUrl} from "../config";

// The print app has no login of its own. An authenticated dashboard opens the
// print tab with a short-lived access token in the URL; we read it here and
// send it as the Authorization header so the (now protected) API accepts us.
const getPrintToken = (): string | null => {
    try {
        // HashRouter keeps the route + query after '#', e.g.
        // #/players/123/team?token=eyJhbG...
        const hash = window.location.hash || "";
        const qIndex = hash.indexOf("?");
        if (qIndex !== -1) {
            const token = new URLSearchParams(hash.slice(qIndex + 1)).get("token");
            if (token) return token;
        }
        // Fallback: a plain query string before the hash (?token=...).
        return new URLSearchParams(window.location.search).get("token");
    } catch {
        return null;
    }
};

const errorLink = onError(({ graphQLErrors }) => {

    if (graphQLErrors && import.meta.env.MODE !== "production") {
        const { path, message, locations } = graphQLErrors[0];

        console.warn(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    }
});

const authLink = setContext((_, { headers }) => {
    const token = getPrintToken();
    return {
        headers: {
            ...headers,
            authorization: token ? token : "",
        },
    };
});

const httpLink = createHttpLink({
    uri: `${apiUrl}/graphql`,
    credentials: "include",
});

export const client = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    credentials: "include"
});

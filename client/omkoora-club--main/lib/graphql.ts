import { ApolloClient, from, fromPromise, InMemoryCache } from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import Router from "next/router";
import useStore from "../store/useStore";
import { REFRESH_TOKEN } from "../graphql";
import { registerRefreshFn, runRefresh, setUnauthenticatedHandler } from "./helpers/authToken";

const authLink = setContext((_, { headers, operationName }) => {
    const token = (useStore.getState() as any).token;

    return {
        headers: {
            ...headers,
            authorization: token ? `${token}` : "",
            "x-apollo-operation-name": operationName,
            "apollo-require-preflight": true,
        },
    };
});

const httpLink = createUploadLink({
    uri: `${process.env.NEXT_PUBLIC_API_URL}/graphql`,
    credentials: "include",
});

// Defined as a closure so the scheduler in authToken.ts can call it without
// pulling the Apollo client into a circular dependency.
export const refreshAccessToken = async (): Promise<string | null> => {
    const { data }: any = await client.query({
        query: REFRESH_TOKEN,
        fetchPolicy: "network-only",
        context: { skipAuthRetry: true },
    });
    return data?.refreshToken?.token || null;
};

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
    if (!graphQLErrors || graphQLErrors.length === 0) return;
    const first = graphQLErrors[0];
    const code = first?.extensions?.code;

    if (code !== "UNAUTHENTICATED") {
        if (process.env.NODE_ENV !== "production") {
            console.warn(`[GraphQL] ${first.message} @ ${first.path?.join(".")}`);
        }
        return;
    }

    // Never recurse: a UNAUTHENTICATED on the refresh itself means the cookie
    // is dead and the user must re-login.
    if (first.path?.[0] === "refreshToken") return;

    return fromPromise(runRefresh()).flatMap((token) => {
        if (!token) {
            // Refresh failed — let the original error bubble; the unauth
            // handler below has already redirected to /login.
            return forward(operation).map(() => ({} as any));
        }
        return forward(operation);
    });
});

export const client = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    credentials: "include",
});

// Wire the scheduler to the live Apollo client and centralize the
// "you are now signed out" UX in one place.
registerRefreshFn(refreshAccessToken);
setUnauthenticatedHandler(() => {
    if (typeof window === "undefined") return;
    Router.push("/login");
});

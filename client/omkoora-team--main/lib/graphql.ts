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

    if (first.path?.[0] === "refreshToken") return;

    return fromPromise(runRefresh()).flatMap((token) => {
        if (!token) {
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

registerRefreshFn(refreshAccessToken);
setUnauthenticatedHandler(() => {
    if (typeof window === "undefined") return;
    Router.push("/login");
});

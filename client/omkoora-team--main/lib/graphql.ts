import {ApolloClient, from, fromPromise, InMemoryCache} from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import useStore from "../store/useStore";
import {useAuth} from "./helpers/_auth";
import {useGetCurrentUser, getNewToken} from "../graphql";
import Router from "next/router";

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
let isRefreshing: boolean;
let pendingRequests: Function[] = [];

const resolvePendingRequests = () => {
    pendingRequests.map((callback) => callback());
    pendingRequests = [];
};

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {

    if (graphQLErrors) {
        const { extensions, path, message, locations } = graphQLErrors[0];

        const { authorization } = operation.getContext().headers;
        if (extensions.code === "UNAUTHENTICATED" && path?.[0] != "refreshToken") {
            let innerForward;
            console.log(isRefreshing)
            if (!isRefreshing) {
                isRefreshing = true;
                innerForward = fromPromise(
                    getNewToken()
                        .then(({data}: any) => {
                            const { refreshToken } = data
                            useStore.setState({ isAuth: true, token: refreshToken?.token });
                            resolvePendingRequests();
                            return true;
                        })
                        .catch(() => {
                            pendingRequests = [];
                            Router.push("/login")
                            return false;
                        })
                        .finally(() => {
                            isRefreshing = false;
                        })
                ).filter((value) => Boolean(value));
            } else {
                innerForward = fromPromise(
                    new Promise<void>((resolve) => {
                        pendingRequests.push(() => resolve());
                    })
                );
            }

            return innerForward.flatMap(() => {
                return forward(operation);
            });
        } else {
            console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
        }
    }
});

const httpLink = createUploadLink({
    uri: `${process.env.NEXT_PUBLIC_API_URL}/graphql`,
    credentials: "include",
});

export const client = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    credentials: "include"
});
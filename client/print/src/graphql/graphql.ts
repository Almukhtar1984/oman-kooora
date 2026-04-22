import {ApolloClient, from, createHttpLink, InMemoryCache} from "@apollo/client";
import { onError } from "@apollo/client/link/error";


const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {

    if (graphQLErrors) {
        const { path, message, locations } = graphQLErrors[0];

        console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    }
});

const apiUrl = "https://api.omkooora.com"
// const apiUrl = "http://localhost:7000"

const httpLink = createHttpLink({
    uri: `${apiUrl}/graphql`,
    credentials: "include",
});

export const client = new ApolloClient({
    link: from([errorLink, httpLink]),
    cache: new InMemoryCache(),
    credentials: "include"
});
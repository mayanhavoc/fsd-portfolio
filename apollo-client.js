import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
    uri: "https://graphql-api.testnet.dandelion.link/",
    cache: new InMemoryCache(),
});

export default client;
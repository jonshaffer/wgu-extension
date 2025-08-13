import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/index.js';

// Determine GraphQL endpoint based on environment configuration
const getGraphQLEndpoint = () => {
  // Allow direct endpoint override
  if (import.meta.env.VITE_GRAPHQL_ENDPOINT) {
    return import.meta.env.VITE_GRAPHQL_ENDPOINT;
  }

  // In production build, always use production endpoint
  if (import.meta.env.PROD) {
    return 'https://us-central1-wgu-extension.cloudfunctions.net/graphql/graphql';
  }

  // In development, check VITE_GRAPHQL_ENV
  const graphqlEnv = import.meta.env.VITE_GRAPHQL_ENV || 'local';
  
  if (graphqlEnv === 'production') {
    return 'https://us-central1-wgu-extension.cloudfunctions.net/graphql/graphql';
  }
  
  // Default to local emulator
  return 'http://127.0.0.1:5001/wgu-extension-site-prod/us-central1/graphql/graphql';
};

const httpLink = createHttpLink({
  uri: getGraphQLEndpoint(),
  credentials: 'same-origin',
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

// Log the endpoint being used (helpful for debugging)
if (import.meta.env.DEV) {
  console.log('GraphQL endpoint:', getGraphQLEndpoint());
}
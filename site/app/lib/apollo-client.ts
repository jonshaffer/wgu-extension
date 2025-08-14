import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client/index.js';
import { onError } from '@apollo/client/link/error';
import { toast } from 'sonner';

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

// Error handling link for development
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (import.meta.env.DEV) {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        );
        
        toast.error('GraphQL Error', {
          description: message,
          duration: 5000,
        });
      });
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
      
      toast.error('Network Error', {
        description: networkError.message || 'Failed to connect to the server',
        action: {
          label: 'Retry',
          onClick: () => {
            // Retry the operation
            return forward(operation);
          }
        }
      });
    }
  }
});

// Combine links
const link = import.meta.env.DEV 
  ? ApolloLink.from([errorLink, httpLink])
  : httpLink;

export const apolloClient = new ApolloClient({
  link,
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
import { ApolloProvider } from '@apollo/client/index.js';
import { apolloClient } from '../lib/apollo-client';

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
}
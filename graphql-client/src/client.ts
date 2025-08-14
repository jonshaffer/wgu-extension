import { GraphQLClient } from 'graphql-request';

export interface ClientConfig {
  endpoint?: string;
  headers?: Record<string, string>;
  cache?: boolean;
}

const DEFAULT_ENDPOINT = 'https://us-central1-wgu-extension-site-prod.cloudfunctions.net/graphql';

/**
 * Create a configured GraphQL client instance
 */
export function createClient(config: ClientConfig = {}): GraphQLClient {
  const endpoint = config.endpoint || DEFAULT_ENDPOINT;
  
  const client = new GraphQLClient(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
  });

  return client;
}

/**
 * Default client instance for convenience
 */
export const defaultClient = createClient();
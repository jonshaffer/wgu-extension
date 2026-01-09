/**
 * Centralized configuration for the WGU Extension site.
 *
 * All environment-specific values should be accessed through this module
 * to ensure consistency and make it easy to switch between environments.
 */

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || "wgu-extension";
const REGION = import.meta.env.VITE_GCP_REGION || "us-central1";

export const config = {
  firebase: {
    projectId: PROJECT_ID,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${PROJECT_ID}.firebaseapp.com`,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${PROJECT_ID}.appspot.com`,
  },

  api: {
    /** Base URL for Cloud Functions */
    baseUrl: import.meta.env.VITE_API_BASE_URL ||
      `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`,

    /** Public GraphQL endpoint (read-only, uses persisted queries) */
    get publicEndpoint() {
      return import.meta.env.VITE_GRAPHQL_ENDPOINT || `${this.baseUrl}/publicApi`;
    },

    /** Admin GraphQL endpoint (authenticated operations) */
    get adminEndpoint() {
      return import.meta.env.VITE_ADMIN_ENDPOINT || `${this.baseUrl}/adminApi`;
    },
  },

  /** Check if running in development mode */
  isDev: import.meta.env.DEV,

  /** Check if running in production mode */
  isProd: import.meta.env.PROD,
} as const;

/**
 * Get the GraphQL endpoint based on environment.
 * For local development, can be overridden via VITE_GRAPHQL_ENV.
 * @return {string} The GraphQL endpoint URL
 */
export function getGraphQLEndpoint(): string {
  // In production build, always use production endpoint
  if (import.meta.env.PROD) {
    return config.api.publicEndpoint;
  }

  // In development, check VITE_GRAPHQL_ENV
  const graphqlEnv = import.meta.env.VITE_GRAPHQL_ENV || "local";

  if (graphqlEnv === "production") {
    return config.api.publicEndpoint;
  }

  // Default to local emulator
  return `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}/publicApi`;
}

/**
 * Get the admin API endpoint based on environment.
 * @return {string} The admin API endpoint URL
 */
export function getAdminEndpoint(): string {
  if (import.meta.env.VITE_ADMIN_ENDPOINT) {
    return import.meta.env.VITE_ADMIN_ENDPOINT;
  }

  if (import.meta.env.PROD) {
    return config.api.adminEndpoint;
  }

  const graphqlEnv = import.meta.env.VITE_GRAPHQL_ENV || "local";

  if (graphqlEnv === "production") {
    return config.api.adminEndpoint;
  }

  return `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}/adminApi`;
}

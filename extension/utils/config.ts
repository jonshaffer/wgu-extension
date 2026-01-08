/**
 * Centralized configuration for the WGU Extension.
 *
 * All environment-specific values should be accessed through this module
 * to ensure consistency across the extension.
 */

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || "wgu-extension";
const REGION = import.meta.env.VITE_GCP_REGION || "us-central1";

export const config = {
  firebase: {
    projectId: PROJECT_ID,
  },

  api: {
    /** Base URL for Cloud Functions */
    baseUrl: import.meta.env.VITE_API_BASE_URL ||
      `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`,

    /** Public GraphQL endpoint path */
    publicApiPath: "/publicApi",

    /** Admin API endpoint path */
    adminApiPath: "/adminApi",

    /** Get full public API URL */
    get publicEndpoint() {
      return `${this.baseUrl}${this.publicApiPath}`;
    },

    /** Get full admin API URL */
    get adminEndpoint() {
      return `${this.baseUrl}${this.adminApiPath}`;
    },
  },

  /** Check if running in development mode */
  isDev: import.meta.env.DEV,

  /** Check if running in production mode */
  isProd: import.meta.env.PROD,
} as const;

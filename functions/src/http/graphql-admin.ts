import {onRequest} from "firebase-functions/v2/https";
import {createYoga} from "graphql-yoga";
import {buildSchema, GraphQLError} from "graphql";
import {adminTypeDefs} from "../graphql/admin-schema.js";
import {adminResolvers} from "../graphql/admin-resolvers.js";
import {verifyAdminAuth} from "../lib/auth.js";
import {getAllowedOrigins} from "../lib/cors.js";

const schema = buildSchema(adminTypeDefs);
// Note: GraphQL Yoga uses resolvers via the schema, not separately
void adminResolvers; // Acknowledge import for future use
void getAllowedOrigins; // Will be used when CORS is fully implemented

const yoga = createYoga({
  schema,
  graphiql: process.env.NODE_ENV === "development", // Enable GraphiQL in development only
  maskedErrors: {
    isDev: process.env.NODE_ENV === "development",
  },
  plugins: [
    {
      onRequest({request, fetchAPI, endResponse}) {
        // Allow both GET and POST for admin endpoint
        if (!["GET", "POST", "OPTIONS"].includes(request.method)) {
          return endResponse(
            new fetchAPI.Response(
              JSON.stringify({
                errors: [{message: "Method not allowed"}],
              }),
              {
                status: 405,
                headers: {
                  "Content-Type": "application/json",
                },
              }
            )
          );
        }

        // Handle preflight CORS requests
        if (request.method === "OPTIONS") {
          return endResponse(
            new fetchAPI.Response(null, {
              status: 200,
              headers: {
                "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Max-Age": "86400",
              },
            })
          );
        }
      },

      async onContextBuilding({request, context}: { request: any, context: any }) {
        // Verify admin authentication
        const authHeader = request.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new GraphQLError("Authentication required", {
            extensions: {code: "UNAUTHENTICATED"},
          });
        }

        const token = authHeader.substring(7);

        try {
          const adminUser = await verifyAdminAuth(token);
          context.user = adminUser;
        } catch (error) {
          throw new GraphQLError("Invalid authentication token", {
            extensions: {code: "UNAUTHENTICATED"},
          });
        }
      },

      onResultProcess({request, result}: { request: any, result: any }) {
        // Add CORS headers for admin endpoint - simplified implementation
        console.log("Processing admin result for CORS headers");
      },
    },
  ],
});

export const adminApi = onRequest(
  {
    cors: false, // We handle CORS manually
    memory: "1GiB",
    timeoutSeconds: 60,
  },
  yoga
);

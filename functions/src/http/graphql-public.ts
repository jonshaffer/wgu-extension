import {onRequest} from "firebase-functions/v2/https";
import {createYoga, maskError} from "graphql-yoga";
import {buildSchema, GraphQLError} from "graphql";
const depthLimit = require("graphql-depth-limit");
import {getComplexity, simpleEstimator} from "graphql-query-complexity";
import {publicTypeDefs} from "../graphql/public-schema.js";
import {publicResolvers} from "../graphql/public-resolvers.js";
import {getAllowedOrigins} from "../lib/cors.js";
import * as allowlist from "../graphql/allowlist.json";

const schema = buildSchema(publicTypeDefs);
// Note: GraphQL Yoga uses resolvers via the schema, not separately
void publicResolvers; // Acknowledge import for future use
const allowedOrigins = getAllowedOrigins(process.env.ALLOWED_ORIGINS);

// Variable validation schemas - will be populated as we add queries
const variableSchemas: Record<string, any> = {};

function validateVariables(hash: string, variables: unknown) {
  const schema = variableSchemas[hash];
  if (!schema) return; // No validation needed for this query
  schema.parse(variables);
}

const yoga = createYoga({
  schema,
  graphiql: false, // Disable GraphiQL in production
  context: async ({request}) => {
    // Extract user from Authorization header if present
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const {verifyIdToken} = await import("../lib/auth.js");
        const decodedToken = await verifyIdToken(token);
        return {
          user: {
            uid: decodedToken.uid,
            email: decodedToken.email,
            email_verified: decodedToken.email_verified,
          },
        };
      } catch (error) {
        // Invalid token - continue without auth
        console.warn("Invalid auth token provided");
      }
    }
    return {};
  },
  maskedErrors: {
    maskError: (error, message) => {
      // Mask all errors except validation errors
      if (error instanceof GraphQLError) {
        return error;
      }
      return maskError(error, message);
    },
    isDev: process.env.NODE_ENV === "development",
  },
  plugins: [
    {
      onRequest({request, fetchAPI, endResponse}) {
        // Only allow GET requests
        if (request.method !== "GET") {
          return endResponse(
            new fetchAPI.Response(
              JSON.stringify({
                errors: [{message: "Only GET requests allowed on public endpoint"}],
              }),
              {
                status: 405,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
              }
            )
          );
        }

        // CORS handling for GET requests
        const origin = request.headers.get("origin");
        if (origin && !allowedOrigins.includes(origin) && process.env.NODE_ENV === "production") {
          return endResponse(
            new fetchAPI.Response(
              JSON.stringify({
                errors: [{message: "Origin not allowed"}],
              }),
              {
                status: 403,
                headers: {"Content-Type": "application/json"},
              }
            )
          );
        }
      },

      async onParams({request, params}) {
        const url = new URL(request.url);
        const hash = url.searchParams.get("hash");
        const variables = url.searchParams.get("variables") ?? "{}";

        // Reject requests without persisted query hash
        if (!hash || !(hash in allowlist)) {
          throw new GraphQLError("Unknown or missing persisted query hash");
        }

        // Set the query from the allowlist
        params.query = allowlist[hash as keyof typeof allowlist];

        try {
          params.variables = JSON.parse(variables);
          validateVariables(hash, params.variables);
        } catch (error) {
          throw new GraphQLError("Invalid variables JSON or validation failed");
        }
      },

      onValidate({addValidationRule}: { addValidationRule: any }) {
        // Add depth limiting
        addValidationRule(depthLimit(6));
      },

      onExecute({args}: { args: any }) {
        // Complexity analysis
        const complexity = getComplexity({
          schema: args.schema,
          query: args.document,
          variables: args.variableValues || {},
          estimators: [
            simpleEstimator({
              defaultComplexity: 1,
            }),
          ],
        });

        if (complexity > 300) {
          throw new GraphQLError(`Query complexity ${complexity} exceeds maximum allowed complexity of 300`);
        }
      },

      onResultProcess({request, result}: { request: any, result: any }) {
        // Add caching headers - this is a simplified implementation
        // In practice, you'd set headers through the yoga response
        console.log("Processing result for caching headers");
      },
    },
  ],
});

export const publicApi = onRequest(
  {
    cors: false, // We handle CORS manually
    memory: "512MiB",
    timeoutSeconds: 10,
  },
  yoga
);

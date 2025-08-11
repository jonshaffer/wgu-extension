import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express4";
import http from "http";
import { typeDefs } from "../graphql/typeDefs";
import { resolvers } from "../graphql/resolvers";
import { getAllowedOrigins } from "../lib/cors";

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = getAllowedOrigins(process.env.ALLOWED_ORIGINS);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  })
);
app.use(express.json());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

async function startApolloServer() {
  await server.start();
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    })
  );
}

startApolloServer();

export const graphql = onRequest({ cors: false }, app as any);

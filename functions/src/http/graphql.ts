import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ApolloServer } from "@apollo/server";
// Use any-typed import to avoid TS path typing issues under NodeNext
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expressMiddleware } = require("@apollo/server/express4");
import { typeDefs } from "../graphql/typeDefs";
import { resolvers } from "../graphql/resolvers";
import { getAllowedOrigins } from "../lib/cors";

const app = express();

// CORS
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

// Body parsing
app.use(bodyParser.json());

// Apollo Server setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

let started = false;
async function ensureStarted() {
  if (!started) {
    await server.start();
    started = true;
  }
}

app.use("/graphql", async (req, res, next) => {
  try {
    await ensureStarted();
  return (expressMiddleware as any)(server)(req, res, next);
  } catch (e) {
    logger.error("GraphQL middleware error", e as any);
    next(e);
  }
});

export const graphql = onRequest({ cors: false }, app as any);

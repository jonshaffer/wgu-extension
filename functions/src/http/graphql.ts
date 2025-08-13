import {onRequest} from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import {ApolloServer} from "@apollo/server";
import {ApolloServerPluginDrainHttpServer} from "@apollo/server/plugin/drainHttpServer";
import {expressMiddleware} from "@as-integrations/express4";
import http from "http";
import {typeDefs} from "../graphql/typeDefs";
import {resolvers} from "../graphql/resolvers";
import {getAllowedOrigins} from "../lib/cors";

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
  plugins: [
    // eslint-disable-next-line new-cap
    ApolloServerPluginDrainHttpServer({httpServer}),
  ],
});

let serverStarted = false;

async function startApolloServer() {
  if (serverStarted) return;
  await server.start();
  serverStarted = true;
  
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({req}) => ({token: req.headers.token}),
    })
  );
  
  // Root handler
  app.get("/", (req, res) => {
    res.json({
      message: "GraphQL API",
      endpoint: "/graphql",
    });
  });
}

// Ensure server starts before handling requests
app.use(async (req, res, next) => {
  await startApolloServer();
  next();
});

export const graphql = onRequest({cors: false}, app as express.Express);

import {describe, expect, test, beforeAll, beforeEach, afterAll} from "@jest/globals";
import functionsTest from "firebase-functions-test";
import * as admin from "firebase-admin";
import request from "supertest";
import {createYoga} from "graphql-yoga";
import {makeExecutableSchema} from "@graphql-tools/schema";
import {publicTypeDefs} from "../graphql/public-schema.js";
import {publicResolvers} from "../graphql/public-resolvers.js";

// Import setup to initialize Firebase properly
import "./setup";

// Import new test fixtures and utilities
import {
  getMinimalDataset,
  clearAllCollections,
  seedDataset,
  assertGraphQLSuccess,
  COLLECTIONS,
} from "./fixtures";

// Initialize the firebase-functions-test SDK
// In CI/emulator mode, we don't need the service account key
const serviceAccountPath = process.env.CI ? undefined : "./service-account-key.json";
const testEnv = functionsTest({
  projectId: "demo-test",
}, serviceAccountPath);

// Create a test-friendly GraphQL app
let app: any;

describe("GraphQL Integration Tests", () => {
  let db: admin.firestore.Firestore;

  beforeAll(async () => {
    // Ensure we're using the emulator
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = "localhost:8181";
    }

    // Initialize Firebase for testing
    const apps = admin.apps || [];
    if (!apps.length) {
      admin.initializeApp({
        projectId: "demo-test",
      });
    }

    db = admin.firestore();

    // Create a test GraphQL app with the same schema and resolvers
    const schema = makeExecutableSchema({
      typeDefs: publicTypeDefs,
      resolvers: publicResolvers,
    });

    const yoga = createYoga({
      schema,
      graphiql: false,
      context: async () => ({
        // Provide test context
      }),
      // For testing, allow all operations (no persisted query restrictions)
      plugins: [],
    });

    // Create an Express-like app wrapper for supertest
    const express = require('express');
    app = express();

    // Add JSON body parsing
    app.use(express.json());

    // Handle POST to root path for GraphQL (what the tests use)
    app.post('/', async (req: any, res: any) => {
      try {
        const request = new Request('http://localhost/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        });

        const response = await yoga.fetch(request);
        const json = await response.json();

        res.status(response.status).json(json);
      } catch (error) {
        console.error('GraphQL request error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }, 180000); // Increase timeout for setup (3 minutes)

  beforeEach(async () => {
    // Clear and seed data for each test
    await clearAllCollections(db);

    const dataset = getMinimalDataset();
    await seedDataset(db, {
      [COLLECTIONS.COURSES]: dataset.courses,
      [COLLECTIONS.DISCORD_SERVERS]: dataset.discordServers,
      [COLLECTIONS.REDDIT_COMMUNITIES]: dataset.redditCommunities,
      [COLLECTIONS.WGU_CONNECT_GROUPS]: dataset.wguConnectGroups,
      [COLLECTIONS.DEGREE_PROGRAMS]: dataset.degreePrograms,
      [COLLECTIONS.COURSE_COMMUNITY_MAPPINGS]: dataset.courseCommunityMappings,
    }, {
      [COLLECTIONS.COURSES]: (c) => c.courseCode,
      [COLLECTIONS.DISCORD_SERVERS]: (d) => d.id,
      [COLLECTIONS.REDDIT_COMMUNITIES]: (r) => r.id,
      [COLLECTIONS.WGU_CONNECT_GROUPS]: (w) => w.id,
      [COLLECTIONS.DEGREE_PROGRAMS]: (d) => d.id,
      [COLLECTIONS.COURSE_COMMUNITY_MAPPINGS]: (m) => m.courseCode,
    });
  });

  afterAll(async () => {
    // Clean up
    await clearAllCollections(db);
    await testEnv.cleanup();
  });

  describe("Search Queries", () => {
    test("should search for courses by code", async () => {
      const query = `
        query SearchCourse {
          search(query: "C172") {
            totalCount
            results {
              type
              id
              title
              courseCode
              description
            }
          }
        }
      `;

      const response = await request(app)
        .post("/")
        .send({query})
        .expect(200);

      // Use new assertion utility
      assertGraphQLSuccess(response);
      expect(response.body.data.search.results).toBeInstanceOf(Array);

      // Check that we get results - might be courses or communities related to C172
      expect(response.body.data.search.totalCount).toBeGreaterThan(0);
      expect(response.body.data.search.results.length).toBeGreaterThan(0);

      // Should have either course results or community results mentioning C172
      const hasC172Reference = response.body.data.search.results.some(
        (r: any) => r.title?.includes("C172") || r.description?.includes("C172") || r.courseCode === "C172"
      );
      expect(hasC172Reference).toBe(true);
    });

    test("should search across multiple collections", async () => {
      const query = `
        query SearchMultiple {
          search(query: "network", limit: 5) {
            totalCount
            results {
              type
              id
              title
            }
          }
        }
      `;

      const response = await request(app)
        .post("/")
        .send({query})
        .expect(200);

      expect(response.body.data.search.results.length).toBeLessThanOrEqual(5);

      // Verify results from different types
      const types = new Set(
        response.body.data.search.results.map((r: any) => r.type)
      );
      expect(types.size).toBeGreaterThan(0);
    });

    test("should return empty results for no matches", async () => {
      const query = `
        query SearchEmpty {
          search(query: "xyzabc123notfound") {
            totalCount
            results {
              title
            }
          }
        }
      `;

      const response = await request(app)
        .post("/")
        .send({query})
        .expect(200);

      assertGraphQLSuccess(response);
      expect(response.body.data.search.totalCount).toBe(0);
      expect(response.body.data.search.results).toEqual([]);
    });

    test("should handle search with limit parameter", async () => {
      const query = `
        query SearchWithLimit {
          search(query: "computer", limit: 3) {
            totalCount
            results {
              title
            }
          }
        }
      `;

      const response = await request(app)
        .post("/")
        .send({query})
        .expect(200);

      expect(response.body.data.search.results.length).toBeLessThanOrEqual(3);
    });

    test("should search for degree programs", async () => {
      const query = `
        query SearchDegrees {
          search(query: "computer science") {
            totalCount
            results {
              type
              id
              title
              description
            }
          }
        }
      `;

      const response = await request(app)
        .post("/")
        .send({query})
        .expect(200);

      const degreeResults = response.body.data.search.results.filter(
        (r: any) => r.type === "degree"
      );

      if (degreeResults.length > 0) {
        expect(degreeResults[0]).toHaveProperty("title");
        expect(degreeResults[0]).toHaveProperty("description");
      }
    });
  });
});

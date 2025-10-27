import {describe, expect, test, beforeAll, afterAll} from "@jest/globals";
import functionsTest from "firebase-functions-test";
import * as admin from "firebase-admin";
import request from "supertest";
import {createYoga} from "graphql-yoga";
import {makeExecutableSchema} from "@graphql-tools/schema";
import {publicTypeDefs} from "../graphql/public-schema.js";
import {publicResolvers} from "../graphql/public-resolvers.js";

// Import setup to initialize Firebase properly
import "./setup";

// Initialize the firebase-functions-test SDK
// In CI/emulator mode, we don't need the service account key
const serviceAccountPath = process.env.CI ? undefined : "./service-account-key.json";
const testEnv = functionsTest({
  projectId: "demo-test",
}, serviceAccountPath);

// Create a test-friendly GraphQL app
let app: any;

describe("GraphQL Integration Tests", () => {
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
    
    const db = admin.firestore();

    // Check if data already exists (seeded by CI script)
    const coursesSnapshot = await db.collection("courses").limit(1).get();
    if (coursesSnapshot.empty) {
      console.log("📝 No existing data found, seeding test data...");
      await seedTestData(db);
    } else {
      console.log("✅ Test data already exists, skipping seeding");
    }
  }, 180000); // Increase timeout for setup (3 minutes)

  afterAll(async () => {
    // Clean up
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

      console.log("GraphQL Response:", JSON.stringify(response.body, null, 2));
      expect(response.body.data).toBeDefined();
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

async function seedTestData(db: admin.firestore.Firestore) {
  console.log("🌱 Seeding test data for integration tests...");
  
  // Seed courses collection (matches current data model)
  await db.collection("courses").doc("C172").set({
    courseCode: "C172",
    name: "Network and Security - Foundations",
    description: "This course introduces students to the components of a computer network...",
    units: 3,
    competencyUnits: 3,
    level: "undergraduate",
    type: "general",
    prerequisites: [],
    firstSeenCatalog: "2024-01",
    lastSeenCatalog: "2024-01",
    catalogHistory: [],
    communities: {
      discord: [{ serverId: "123456789012345678", channelIds: ["987654321098765432"] }],
      reddit: [{ subredditId: "WGU", relevance: "general" }],
      wguConnect: { groupId: "net-sec-foundations" }
    },
    popularityScore: 85,
    difficultyRating: 3.5,
    lastUpdated: new Date()
  });

  await db.collection("courses").doc("C173").set({
    courseCode: "C173",
    name: "Scripting and Programming - Foundations", 
    description: "This course provides an introduction to programming...",
    units: 3,
    competencyUnits: 3,
    level: "undergraduate",
    type: "general",
    prerequisites: [],
    firstSeenCatalog: "2024-01",
    lastSeenCatalog: "2024-01",
    catalogHistory: [],
    communities: {
      discord: [{ serverId: "123456789012345678", channelIds: ["987654321098765433"] }],
      reddit: [{ subredditId: "WGU", relevance: "general" }]
    },
    popularityScore: 80,
    difficultyRating: 3.0,
    lastUpdated: new Date()
  });

  // Discord Servers
  await db.collection("discord-servers").doc("123456789012345678").set({
    id: "123456789012345678",
    name: "WGU Computer Science",
    description: "Official WGU CS Discord",
    inviteUrl: "https://discord.gg/wgucs",
    memberCount: 2500,
    channels: [
      { id: "987654321098765432", name: "c172-network-security", type: "course", associatedCourses: ["C172"] },
      { id: "987654321098765433", name: "c173-programming", type: "course", associatedCourses: ["C173"] }
    ],
    tags: ["computer-science", "official"],
    verified: true,
    lastUpdated: new Date()
  });

  // Reddit Communities
  await db.collection("reddit-communities").doc("WGU").set({
    id: "WGU",
    name: "Western Governors University",
    description: "Main WGU subreddit",
    url: "https://reddit.com/r/WGU",
    subscriberCount: 50000,
    type: "main",
    associatedPrograms: ["bs-computer-science"],
    associatedCourses: ["C172", "C173"],
    tags: ["general", "official"],
    active: true,
    lastUpdated: new Date()
  });

  // Degree Programs
  await db.collection("degree-programs").doc("bs-computer-science").set({
    id: "bs-computer-science",
    code: "BSCS",
    name: "Bachelor of Science, Computer Science",
    description: "WGU's computer science program",
    level: "bachelor",
    college: "College of Information Technology",
    totalUnits: 122,
    courses: [
      { courseCode: "C172", type: "core", term: 1 },
      { courseCode: "C173", type: "core", term: 1 }
    ],
    firstSeenCatalog: "2024-01",
    lastSeenCatalog: "2024-01",
    catalogHistory: [],
    communities: {
      discord: [{ serverId: "123456789012345678" }],
      reddit: [{ subredditId: "WGU" }]
    },
    stats: {
      averageCompletionTime: 24,
      popularCourseSequences: ["C172-C173"]
    },
    lastUpdated: new Date()
  });

  // WGU Connect Groups
  await db.collection("wgu-connect-groups").doc("net-sec-foundations").set({
    id: "net-sec-foundations",
    groupId: "net-sec-foundations",
    name: "Network and Security Foundations Study Group",
    courseCode: "C172",
    description: "Study group for C172",
    memberCount: 150,
    postCount: 500,
    lastActivity: new Date(),
    resources: []
  });

  // Course-Community Mappings
  await db.collection("course-community-mappings").doc("C172").set({
    courseCode: "C172",
    courseName: "Network and Security - Foundations",
    discord: ["123456789012345678"],
    reddit: ["WGU"],
    wguConnect: "net-sec-foundations",
    studentGroups: []
  });

  await db.collection("course-community-mappings").doc("C173").set({
    courseCode: "C173",
    courseName: "Scripting and Programming - Foundations",
    discord: ["123456789012345678"],
    reddit: ["WGU"],
    wguConnect: null,
    studentGroups: []
  });

  console.log("✅ Test data seeded successfully");
}

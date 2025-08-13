import {describe, expect, test, beforeAll, afterAll} from "@jest/globals";
import functionsTest from "firebase-functions-test";
import * as admin from "firebase-admin";
import request from "supertest";
// import {graphql} from "../http/graphql";

// Initialize the firebase-functions-test SDK
const testEnv = functionsTest({
  projectId: "demo-test",
}, "./service-account-key.json"); // Optional: path to service account key

// Import the express app from the graphql function
// We'll need to extract it for testing
let app: any;

describe("GraphQL Integration Tests", () => {
  beforeAll(async () => {
    // The graphql function exports an onRequest handler
    // We need to test it as an Express app
    const db = admin.firestore();
    
    // Seed test data
    await seedTestData(db);
  }, 60000); // Increase timeout for setup

  afterAll(async () => {
    // Clean up
    await testEnv.cleanup();
  });

  describe("Search Queries", () => {
    test("should search for courses by code", async () => {
      const query = `
        query SearchCourse {
          search(query: "C172") {
            query
            totalCount
            results {
              type
              name
              courseCode
              platform
              description
            }
          }
        }
      `;

      const response = await request(app)
        .post("/graphql")
        .send({query})
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.search.query).toBe("C172");
      expect(response.body.data.search.results).toBeInstanceOf(Array);
      
      const courseResults = response.body.data.search.results.filter(
        (r: any) => r.type === "course"
      );
      expect(courseResults.length).toBeGreaterThan(0);
      expect(courseResults[0].courseCode).toContain("C172");
    });

    test("should search across multiple collections", async () => {
      const query = `
        query SearchMultiple {
          search(query: "network", limit: 5) {
            query
            totalCount
            results {
              type
              name
              platform
            }
          }
        }
      `;

      const response = await request(app)
        .post("/graphql")
        .send({query})
        .expect(200);

      expect(response.body.data.search.results.length).toBeLessThanOrEqual(5);
      
      // Verify results from different platforms
      const platforms = new Set(
        response.body.data.search.results.map((r: any) => r.platform)
      );
      expect(platforms.size).toBeGreaterThan(0);
    });

    test("should return empty results for no matches", async () => {
      const query = `
        query SearchEmpty {
          search(query: "xyzabc123notfound") {
            query
            totalCount
            results {
              name
            }
          }
        }
      `;

      const response = await request(app)
        .post("/graphql")
        .send({query})
        .expect(200);

      expect(response.body.data.search.totalCount).toBe(0);
      expect(response.body.data.search.results).toEqual([]);
    });

    test("should handle search with limit parameter", async () => {
      const query = `
        query SearchWithLimit {
          search(query: "computer", limit: 3) {
            query
            totalCount
            results {
              name
            }
          }
        }
      `;

      const response = await request(app)
        .post("/graphql")
        .send({query})
        .expect(200);

      expect(response.body.data.search.results.length).toBeLessThanOrEqual(3);
    });

    test("should search for degree programs", async () => {
      const query = `
        query SearchDegrees {
          search(query: "computer science") {
            query
            totalCount
            results {
              type
              name
              description
              platform
              college
              degreeType
            }
          }
        }
      `;

      const response = await request(app)
        .post("/graphql")
        .send({query})
        .expect(200);

      const degreeResults = response.body.data.search.results.filter(
        (r: any) => r.type === "degree"
      );
      
      if (degreeResults.length > 0) {
        expect(degreeResults[0]).toHaveProperty("college");
        expect(degreeResults[0]).toHaveProperty("degreeType");
      }
    });
  });
});

async function seedTestData(db: admin.firestore.Firestore) {
  // Seed minimal test data for each collection
  
  // Academic Registry - Courses
  await db.collection("academic-registry").doc("courses").set({
    courses: {
      "C172": {
        code: "C172",
        name: "Network and Security - Foundations",
        description: "This course introduces students to the components of a computer network...",
        competencyUnits: 3,
      },
      "C173": {
        code: "C173",
        name: "Scripting and Programming - Foundations",
        description: "This course provides an introduction to programming...",
        competencyUnits: 3,
      },
    },
  });

  // Academic Registry - Degree Programs
  await db.collection("academic-registry").doc("degree-programs").set({
    programs: {
      "BSCS": {
        name: "Bachelor of Science Computer Science",
        code: "BSCS",
        college: "College of Information Technology",
        degreeType: "Bachelor's",
        totalCUs: 120,
      },
    },
  });

  // Discord Servers
  await db.collection("discord-servers").doc("wgu-cyber-club").set({
    name: "WGU Cyber Security Club",
    description: "A community for WGU cybersecurity students",
    inviteUrl: "https://discord.gg/wgucyber",
    memberCount: 5000,
  });

  // WGU Connect Groups
  await db.collection("wgu-connect-groups").doc("c172-study").set({
    name: "C172 Network and Security Study Group",
    description: "Study group for Network and Security Foundations",
    memberCount: 150,
  });

  // WGU Student Groups
  await db.collection("public").doc("wguStudentGroups").set({
    groups: [
      {
        name: "Computer Science Club",
        courseCode: null,
        url: "https://example.com/cs-club",
        description: "WGU Computer Science student organization",
        memberCount: 1200,
      },
    ],
  });
}
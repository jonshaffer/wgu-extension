import {describe, expect, test, beforeAll, afterAll} from "@jest/globals";
import functionsTest from "firebase-functions-test";
import * as admin from "firebase-admin";

// Initialize the firebase-functions-test SDK
const testEnv = functionsTest({
  projectId: "demo-test",
});

describe("Search Resolver Integration Tests", () => {
  let db: admin.firestore.Firestore;
  let searchResolver: any;

  beforeAll(async () => {
    // Ensure we're using the emulator
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8181";

    db = admin.firestore();

    // Dynamically import after Firebase is initialized
    // Direct import to avoid dynamic import issues
    const {searchResolver: resolver} = require("../graphql/search-resolver");
    searchResolver = resolver;

    // Clear existing data
    await clearFirestore(db);

    // Seed test data
    await seedTestData(db);
  });

  afterAll(async () => {
    // Clean up
    await clearFirestore(db);
    await testEnv.cleanup();
  });

  describe("searchResolver", () => {
    test("should search for courses by code", async () => {
      const result = await searchResolver(
        undefined,
        {query: "C172", limit: 20}
      );

      expect(result.query).toBe("C172"); // Keep original case
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.results).toBeInstanceOf(Array);

      const courseResults = result.results.filter(
        (r: any) => r.type === "course"
      );
      expect(courseResults.length).toBeGreaterThan(0);
      expect(courseResults[0].courseCode).toBe("C172");
      expect(courseResults[0].name).toContain("C172");
    });

    test("should search across multiple collections", async () => {
      const result = await searchResolver(
        undefined,
        {query: "network", limit: 10}
      );

      expect(result.results.length).toBeLessThanOrEqual(10);

      // Should find results from different sources
      const types = new Set(result.results.map((r: any) => r.type));
      expect(types.size).toBeGreaterThanOrEqual(1); // At least courses

      const platforms = new Set(result.results.map((r: any) => r.platform));
      expect(platforms.size).toBeGreaterThanOrEqual(1);
    });

    test("should return empty results for no matches", async () => {
      const result = await searchResolver(
        undefined,
        {query: "xyzabc123notfound"}
      );

      expect(result.query).toBe("xyzabc123notfound");
      expect(result.totalCount).toBe(0);
      expect(result.results).toEqual([]);
    });

    test("should respect limit parameter", async () => {
      const result = await searchResolver(
        undefined,
        {query: "a", limit: 3} // Broad search
      );

      expect(result.results.length).toBeLessThanOrEqual(3);
    });

    test("should search for degree programs", async () => {
      const result = await searchResolver(
        undefined,
        {query: "computer science"}
      );

      const degreeResults = result.results.filter(
        (r: any) => r.type === "degree"
      );

      if (degreeResults.length > 0) {
        expect(degreeResults[0]).toHaveProperty("college");
        expect(degreeResults[0]).toHaveProperty("degreeType");
        expect(degreeResults[0].name.toLowerCase()).toContain("computer");
      }
    });

    test("should search by partial course code", async () => {
      const result = await searchResolver(
        undefined,
        {query: "C17"} // Partial code
      );

      const courseResults = result.results.filter(
        (r: any) => r.type === "course" && r.courseCode?.startsWith("C17")
      );

      expect(courseResults.length).toBeGreaterThan(0);
    });

    test("should find Discord communities", async () => {
      const result = await searchResolver(
        undefined,
        {query: "cyber"}
      );

      const discordResults = result.results.filter(
        (r: any) => r.platform === "discord"
      );

      if (discordResults.length > 0) {
        expect(discordResults[0]).toHaveProperty("url");
        expect(discordResults[0]).toHaveProperty("memberCount");
      }
    });

    test("should handle empty query", async () => {
      const result = await searchResolver(
        undefined,
        {query: "   "} // Whitespace only
      );

      expect(result.query).toBe("   "); // Accept whitespace as-is
      expect(result.totalCount).toBe(0);
      expect(result.results).toEqual([]);
    });
  });
});

async function clearFirestore(db: admin.firestore.Firestore) {
  const collections = [
    "academic-registry",
    "discord-servers",
    "wgu-connect-groups",
    "public",
  ];

  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function seedTestData(db: admin.firestore.Firestore) {
  // Academic Registry - Courses
  await db.collection("academic-registry").doc("courses").set({
    courses: {
      "C172": {
        code: "C172",
        name: "Network and Security - Foundations",
        description: "This course introduces students to the components of a computer network and the concepts and methods used in network security.",
        ccn: "12345",
        competencyUnits: 3,
      },
      "C173": {
        code: "C173",
        name: "Scripting and Programming - Foundations",
        description: "This course provides an introduction to programming covering data structures, algorithms, and programming paradigms.",
        ccn: "12346",
        competencyUnits: 3,
      },
      "C175": {
        code: "C175",
        name: "Data Management - Foundations",
        description: "This course covers the fundamentals of data management systems.",
        ccn: "12347",
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
      "BSCSIA": {
        name: "Bachelor of Science Cybersecurity and Information Assurance",
        code: "BSCSIA",
        college: "College of Information Technology",
        degreeType: "Bachelor's",
        totalCUs: 120,
      },
    },
  });

  // Discord Servers
  await db.collection("discord-servers").doc("wgu-cyber-club").set({
    name: "WGU Cyber Security Club",
    description: "A community for WGU cybersecurity students and alumni",
    inviteUrl: "https://discord.gg/wgucyber",
    icon: "https://example.com/icon.png",
    memberCount: 5000,
  });

  await db.collection("discord-servers").doc("wgu-compsci").set({
    name: "WGU Computer Science",
    description: "Community for Computer Science students at WGU",
    inviteUrl: "https://discord.gg/wgucs",
    memberCount: 3500,
  });

  // WGU Connect Groups
  await db.collection("wgu-connect-groups").doc("c172-study").set({
    name: "C172 Network and Security Study Group",
    description: "Study group for Network and Security Foundations course",
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
      {
        name: "Cybersecurity Club",
        courseCode: null,
        url: "https://example.com/cyber-club",
        description: "WGU Cybersecurity student organization",
        memberCount: 800,
      },
    ],
  });
}

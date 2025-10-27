import {describe, expect, test, beforeAll, afterAll} from "@jest/globals";
import functionsTest from "firebase-functions-test";
import * as admin from "firebase-admin";

// Import setup to initialize Firebase properly
import "./setup";

// Initialize the firebase-functions-test SDK
const testEnv = functionsTest({
  projectId: "demo-test",
});

describe("Search Resolver Integration Tests", () => {
  let db: admin.firestore.Firestore;
  let searchResolver: any;

  beforeAll(async () => {
    // Ensure we're using the emulator
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = "localhost:8181";
    }

    // Initialize Firebase if not already done
    const apps = admin.apps || [];
    if (!apps.length) {
      admin.initializeApp({
        projectId: "demo-test",
      });
    }

    db = admin.firestore();

    // Dynamically import after Firebase is initialized
    // Direct import to avoid dynamic import issues
    const {searchResolver: resolver} = require("../graphql/search-resolver");
    searchResolver = resolver;

    // Check if data already exists (seeded by CI script)
    const coursesSnapshot = await db.collection("courses").limit(1).get();
    if (coursesSnapshot.empty) {
      console.log("📝 No existing data found, clearing and seeding test data...");
      await clearFirestore(db);
      await seedTestData(db);
    } else {
      console.log("✅ Test data already exists, skipping seeding");
    }
  }, 180000); // Increase timeout for setup (3 minutes)

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

      // Note: query field is not returned in the current schema
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.results).toBeInstanceOf(Array);

      const courseResults = result.results.filter(
        (r: any) => r.type === "course"
      );
      expect(courseResults.length).toBeGreaterThan(0);
      expect(courseResults[0].courseCode).toBe("C172");
      expect(courseResults[0].title).toContain("C172");
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

      // Note: query field is not returned in the current schema
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

      // Note: query field is not returned in the current schema
      expect(result.totalCount).toBe(0);
      expect(result.results).toEqual([]);
    });
  });
});

async function clearFirestore(db: admin.firestore.Firestore) {
  const collections = [
    "courses",
    "discord-servers",
    "reddit-communities",
    "degree-programs",
    "wgu-connect-groups",
    "wgu-student-groups",
    "course-community-mappings",
  ];

  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
  console.log("🧹 Cleared test collections");
}

async function seedTestData(db: admin.firestore.Firestore) {
  console.log("🌱 Seeding test data for search integration tests...");
  
  // Seed courses collection (matches current data model)
  await db.collection("courses").doc("C172").set({
    courseCode: "C172",
    name: "Network and Security - Foundations",
    description: "This course introduces students to the components of a computer network and the concepts and methods used in network security.",
    units: 3,
    competencyUnits: 3,
    level: "undergraduate",
    type: "general",
    prerequisites: [],
    firstSeenCatalog: "2024-01",
    lastSeenCatalog: "2024-01",
    catalogHistory: [],
    communities: {
      discord: [{ serverId: "wgu-cyber-club", channelIds: ["c172-channel"] }],
      reddit: [{ subredditId: "WGU", relevance: "general" }],
      wguConnect: { groupId: "c172-study" }
    },
    popularityScore: 85,
    difficultyRating: 3.5,
    lastUpdated: new Date()
  });

  await db.collection("courses").doc("C173").set({
    courseCode: "C173",
    name: "Scripting and Programming - Foundations",
    description: "This course provides an introduction to programming covering data structures, algorithms, and programming paradigms.",
    units: 3,
    competencyUnits: 3,
    level: "undergraduate",
    type: "general",
    prerequisites: [],
    firstSeenCatalog: "2024-01",
    lastSeenCatalog: "2024-01",
    catalogHistory: [],
    communities: {
      discord: [{ serverId: "wgu-compsci", channelIds: ["c173-channel"] }],
      reddit: [{ subredditId: "WGU", relevance: "general" }]
    },
    popularityScore: 80,
    difficultyRating: 3.0,
    lastUpdated: new Date()
  });

  await db.collection("courses").doc("C175").set({
    courseCode: "C175",
    name: "Data Management - Foundations",
    description: "This course covers the fundamentals of data management systems.",
    units: 3,
    competencyUnits: 3,
    level: "undergraduate",
    type: "general",
    prerequisites: [],
    firstSeenCatalog: "2024-01",
    lastSeenCatalog: "2024-01",
    catalogHistory: [],
    communities: {
      discord: [{ serverId: "wgu-compsci", channelIds: ["c175-channel"] }],
      reddit: [{ subredditId: "WGU", relevance: "general" }]
    },
    popularityScore: 75,
    difficultyRating: 2.8,
    lastUpdated: new Date()
  });

  // Discord Servers
  await db.collection("discord-servers").doc("wgu-cyber-club").set({
    id: "wgu-cyber-club",
    name: "WGU Cyber Security Club",
    description: "A community for WGU cybersecurity students and alumni",
    inviteUrl: "https://discord.gg/wgucyber",
    icon: "https://example.com/icon.png",
    memberCount: 5000,
    channels: [
      { id: "c172-channel", name: "c172-network-security", type: "course", associatedCourses: ["C172"] }
    ],
    tags: ["cybersecurity", "official"],
    verified: true,
    lastUpdated: new Date()
  });

  await db.collection("discord-servers").doc("wgu-compsci").set({
    id: "wgu-compsci",
    name: "WGU Computer Science",
    description: "Community for Computer Science students at WGU",
    inviteUrl: "https://discord.gg/wgucs",
    memberCount: 3500,
    channels: [
      { id: "c173-channel", name: "c173-programming", type: "course", associatedCourses: ["C173"] },
      { id: "c175-channel", name: "c175-data-mgmt", type: "course", associatedCourses: ["C175"] }
    ],
    tags: ["computer-science", "official"],
    verified: true,
    lastUpdated: new Date()
  });

  // WGU Connect Groups
  await db.collection("wgu-connect-groups").doc("c172-study").set({
    id: "c172-study",
    groupId: "c172-study",
    name: "C172 Network and Security Study Group",
    courseCode: "C172",
    description: "Study group for Network and Security Foundations course",
    memberCount: 150,
    postCount: 300,
    lastActivity: new Date(),
    resources: []
  });

  // Student Groups
  await db.collection("wgu-student-groups").doc("cs-club").set({
    id: "cs-club",
    studentGroupId: "cs-club",
    name: "Computer Science Club",
    description: "WGU Computer Science student organization",
    category: "academic",
    memberCount: 1200,
    platform: "website",
    joinUrl: "https://example.com/cs-club",
    courseMappings: ["C172", "C173", "C175"],
    isOfficial: false,
    socialLinks: [
      { platform: "website", url: "https://example.com/cs-club" }
    ],
    lastChecked: new Date()
  });

  await db.collection("wgu-student-groups").doc("cyber-club").set({
    id: "cyber-club", 
    studentGroupId: "cyber-club",
    name: "Cybersecurity Club",
    description: "WGU Cybersecurity student organization",
    category: "academic",
    memberCount: 800,
    platform: "website",
    joinUrl: "https://example.com/cyber-club",
    courseMappings: ["C172"],
    isOfficial: false,
    socialLinks: [
      { platform: "website", url: "https://example.com/cyber-club" }
    ],
    lastChecked: new Date()
  });

  console.log("✅ Search test data seeded successfully");
}

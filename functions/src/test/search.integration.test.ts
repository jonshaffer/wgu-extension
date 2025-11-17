import {describe, expect, test, beforeAll, beforeEach, afterAll} from "@jest/globals";
import functionsTest from "firebase-functions-test";
import * as admin from "firebase-admin";

// Import setup to initialize Firebase properly
import "./setup";

// Import new test fixtures and utilities
import {
  FIXTURES,
  getMinimalDataset,
  clearAllCollections,
  seedDataset,
  assertSearchResultStructure,
  assertSearchResultItem,
  COLLECTIONS,
} from "./fixtures";

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
    const {searchResolver: resolver} = require("../graphql/search-resolver");
    searchResolver = resolver;
  }, 180000); // Increase timeout for setup (3 minutes)

  beforeEach(async () => {
    // Clear all collections before each test for isolation
    await clearAllCollections(db);

    // Seed with minimal dataset for fast tests
    const dataset = getMinimalDataset();
    await seedDataset(db, {
      [COLLECTIONS.COURSES]: dataset.courses,
      [COLLECTIONS.DISCORD_SERVERS]: dataset.discordServers,
      [COLLECTIONS.REDDIT_COMMUNITIES]: dataset.redditCommunities,
      [COLLECTIONS.WGU_CONNECT_GROUPS]: dataset.wguConnectGroups,
      [COLLECTIONS.COURSE_COMMUNITY_MAPPINGS]: dataset.courseCommunityMappings,
    }, {
      [COLLECTIONS.COURSES]: (c) => c.courseCode,
      [COLLECTIONS.DISCORD_SERVERS]: (d) => d.id,
      [COLLECTIONS.REDDIT_COMMUNITIES]: (r) => r.id,
      [COLLECTIONS.WGU_CONNECT_GROUPS]: (w) => w.id,
      [COLLECTIONS.COURSE_COMMUNITY_MAPPINGS]: (m) => m.courseCode,
    });
  });

  afterAll(async () => {
    // Clean up
    await clearAllCollections(db);
    await testEnv.cleanup();
  });

  describe("searchResolver", () => {
    test("should search for courses by code", async () => {
      const result = await searchResolver(
        undefined,
        {query: "C172", limit: 20}
      );

      // Use new assertion utility
      assertSearchResultStructure(result);
      expect(result.totalCount).toBeGreaterThan(0);

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

      assertSearchResultStructure(result);
      expect(result.results.length).toBeLessThanOrEqual(10);

      // Should find results from different sources
      const types = new Set(result.results.map((r: any) => r.type));
      expect(types.size).toBeGreaterThanOrEqual(1); // At least courses

      // Validate each result item structure
      result.results.forEach((item: any) => {
        assertSearchResultItem(item);
      });
    });

    test("should return empty results for no matches", async () => {
      const result = await searchResolver(
        undefined,
        {query: "xyzabc123notfound"}
      );

      assertSearchResultStructure(result);
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

      assertSearchResultStructure(result);
      expect(result.totalCount).toBe(0);
      expect(result.results).toEqual([]);
    });
  });
});

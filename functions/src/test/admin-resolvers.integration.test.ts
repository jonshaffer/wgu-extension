import {describe, expect, test, beforeAll, beforeEach} from "@jest/globals";
import {GraphQLError} from "graphql";
import {adminResolvers} from "../graphql/admin-resolvers";
import {defaultDb, adminDb} from "../lib/firebase-admin-db";
import {COLLECTIONS} from "../lib/data-model";

// Mock context for admin user
const adminContext = {
  user: {
    uid: "test-admin-user",
    email: "admin@test.com",
    admin: true,
  },
};

// Mock context for non-admin user
const userContext = {
  user: {
    uid: "test-regular-user",
    email: "user@test.com",
    admin: false,
  },
};

// Mock context for unauthenticated request
const noAuthContext = {
  user: null,
};

describe("Admin Resolvers Integration Tests", () => {
  beforeAll(async () => {
    // Ensure we're using the emulator
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBeDefined();
  });

  beforeEach(async () => {
    // Clear test collections before each test
    const collections = [
      COLLECTIONS.DISCORD_SERVERS,
      COLLECTIONS.REDDIT_COMMUNITIES,
      COLLECTIONS.COURSES,
      COLLECTIONS.DEGREE_PROGRAMS,
    ];

    for (const collection of collections) {
      const snapshot = await defaultDb.collection(collection).get();
      const batch = defaultDb.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // Clear change history
    const changeHistory = await adminDb.collection("change-history").get();
    const batch = adminDb.batch();
    changeHistory.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  });

  describe("Authentication and Authorization", () => {
    test("should reject unauthenticated requests", async () => {
      await expect(
        adminResolvers.Mutation.ingestDiscordServer(
          null,
          {
            input: {
              serverId: "123456789012345678",
              name: "Test Server",
              inviteUrl: "https://discord.gg/test",
            },
          },
          noAuthContext
        )
      ).rejects.toThrow(GraphQLError);
    });

    test("should reject non-admin requests", async () => {
      await expect(
        adminResolvers.Mutation.ingestDiscordServer(
          null,
          {
            input: {
              serverId: "123456789012345678",
              name: "Test Server",
              inviteUrl: "https://discord.gg/test",
            },
          },
          userContext
        )
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe("Discord Server Mutations", () => {
    const validDiscordInput = {
      serverId: "123456789012345678",
      name: "WGU Computer Science",
      description: "Official WGU CS Discord",
      inviteUrl: "https://discord.gg/wgucs",
      memberCount: 1500,
      tags: ["computer-science", "official"],
      verified: true,
    };

    test("should ingest a valid Discord server", async () => {
      const result = await adminResolvers.Mutation.ingestDiscordServer(
        null,
        {input: validDiscordInput},
        adminContext
      );

      expect(result).toMatchObject({
        serverId: validDiscordInput.serverId,
        name: validDiscordInput.name,
        description: validDiscordInput.description,
        inviteUrl: validDiscordInput.inviteUrl,
        memberCount: validDiscordInput.memberCount,
        tags: validDiscordInput.tags,
        verified: validDiscordInput.verified,
      });

      // Verify it was saved to Firestore
      const doc = await defaultDb.collection(COLLECTIONS.DISCORD_SERVERS)
        .doc(validDiscordInput.serverId)
        .get();
      expect(doc.exists).toBe(true);
      expect(doc.data()?.name).toBe(validDiscordInput.name);

      // Verify change history was logged
      const history = await adminDb.collection("change-history")
        .where("documentId", "==", validDiscordInput.serverId)
        .get();
      expect(history.size).toBe(1);
      expect(history.docs[0].data().action).toBe("CREATE");
    });

    test("should reject invalid Discord server ID", async () => {
      const invalidInput = {
        ...validDiscordInput,
        serverId: "invalid-id", // Not a valid Discord snowflake
      };

      await expect(
        adminResolvers.Mutation.ingestDiscordServer(
          null,
          {input: invalidInput},
          adminContext
        )
      ).rejects.toThrow(/Invalid Discord ID format/);
    });

    test("should reject invalid invite URL", async () => {
      const invalidInput = {
        ...validDiscordInput,
        inviteUrl: "not-a-discord-url",
      };

      await expect(
        adminResolvers.Mutation.ingestDiscordServer(
          null,
          {input: invalidInput},
          adminContext
        )
      ).rejects.toThrow(/Invalid Discord invite URL format/);
    });

    test("should update an existing Discord server", async () => {
      // First create a server
      await adminResolvers.Mutation.ingestDiscordServer(
        null,
        {input: validDiscordInput},
        adminContext
      );

      // Then update it
      const updateInput = {
        name: "Updated WGU CS Discord",
        memberCount: 2000,
        tags: ["computer-science", "official", "updated"],
      };

      const result = await adminResolvers.Mutation.updateDiscordServer(
        null,
        {id: validDiscordInput.serverId, input: updateInput},
        adminContext
      );

      expect(result.name).toBe(updateInput.name);
      expect(result.memberCount).toBe(updateInput.memberCount);
      expect(result.tags).toEqual(updateInput.tags);
      // Original fields should remain
      expect(result.description).toBe(validDiscordInput.description);
    });

    test("should delete a Discord server", async () => {
      // First create a server
      await adminResolvers.Mutation.ingestDiscordServer(
        null,
        {input: validDiscordInput},
        adminContext
      );

      // Then delete it
      const result = await adminResolvers.Mutation.deleteDiscordServer(
        null,
        {id: validDiscordInput.serverId},
        adminContext
      );

      expect(result).toBe(true);

      // Verify it was deleted
      const doc = await defaultDb.collection(COLLECTIONS.DISCORD_SERVERS)
        .doc(validDiscordInput.serverId)
        .get();
      expect(doc.exists).toBe(false);
    });
  });

  describe("Reddit Community Mutations", () => {
    const validRedditInput = {
      subreddit: "WGU_CompSci",
      name: "WGU Computer Science",
      description: "Subreddit for WGU CS students",
      url: "https://reddit.com/r/WGU_CompSci",
      subscriberCount: 25000,
      type: "program-specific" as const,
      tags: ["computer-science", "bs-cs"],
      active: true,
    };

    test("should ingest a valid Reddit community", async () => {
      const result = await adminResolvers.Mutation.ingestRedditCommunity(
        null,
        {input: validRedditInput},
        adminContext
      );

      expect(result).toMatchObject({
        subredditName: validRedditInput.subreddit,
        name: validRedditInput.name,
        url: validRedditInput.url,
        subscriberCount: validRedditInput.subscriberCount,
      });

      // Verify it was saved to Firestore
      const doc = await defaultDb.collection(COLLECTIONS.REDDIT_COMMUNITIES)
        .doc(validRedditInput.subreddit)
        .get();
      expect(doc.exists).toBe(true);
    });

    test("should reject invalid subreddit name", async () => {
      const invalidInput = {
        ...validRedditInput,
        subreddit: "WGU Comp-Sci!", // Contains invalid characters
      };

      await expect(
        adminResolvers.Mutation.ingestRedditCommunity(
          null,
          {input: invalidInput},
          adminContext
        )
      ).rejects.toThrow(/Subreddit name can only contain letters, numbers, and underscores/);
    });

    test("should reject invalid Reddit URL", async () => {
      const invalidInput = {
        ...validRedditInput,
        url: "https://notreddit.com/r/WGU",
      };

      await expect(
        adminResolvers.Mutation.ingestRedditCommunity(
          null,
          {input: invalidInput},
          adminContext
        )
      ).rejects.toThrow(/Invalid Reddit URL format/);
    });
  });

  describe("Course Mutations", () => {
    const validCourseInput = {
      courseCode: "C172",
      name: "Network and Security - Foundations",
      description: "Introduction to networking and security concepts",
      units: 3,
      level: "undergraduate" as const,
      type: "general" as const,
      prerequisites: ["C175"],
      popularityScore: 85,
      difficultyRating: 3.5,
    };

    test("should upsert a valid course", async () => {
      const result = await adminResolvers.Mutation.upsertCourse(
        null,
        {input: validCourseInput},
        adminContext
      );

      expect(result).toMatchObject({
        courseCode: validCourseInput.courseCode,
        name: validCourseInput.name,
        units: validCourseInput.units,
        level: validCourseInput.level,
      });

      // Verify it was saved
      const doc = await defaultDb.collection(COLLECTIONS.COURSES)
        .doc(validCourseInput.courseCode)
        .get();
      expect(doc.exists).toBe(true);
    });

    test("should reject invalid course code format", async () => {
      const invalidInput = {
        ...validCourseInput,
        courseCode: "CS172", // Should be letter + 3 digits
      };

      await expect(
        adminResolvers.Mutation.upsertCourse(
          null,
          {input: invalidInput},
          adminContext
        )
      ).rejects.toThrow(/Course code must be a letter followed by 3 digits/);
    });

    test("should reject invalid units", async () => {
      const invalidInput = {
        ...validCourseInput,
        units: 15, // Max is 12
      };

      await expect(
        adminResolvers.Mutation.upsertCourse(
          null,
          {input: invalidInput},
          adminContext
        )
      ).rejects.toThrow(/Units must be at most 12/);
    });

    test("should update an existing course", async () => {
      // First create
      await adminResolvers.Mutation.upsertCourse(
        null,
        {input: validCourseInput},
        adminContext
      );

      // Then update with new description
      const updatedInput = {
        ...validCourseInput,
        description: "Updated description for networking course",
      };

      const result = await adminResolvers.Mutation.upsertCourse(
        null,
        {input: updatedInput},
        adminContext
      );

      expect(result.description).toBe(updatedInput.description);

      // Verify change history shows UPDATE
      const history = await adminDb.collection("change-history")
        .where("documentId", "==", validCourseInput.courseCode)
        .where("action", "==", "UPDATE")
        .get();
      expect(history.size).toBe(1);
    });
  });

  describe("Degree Plan Mutations", () => {
    const validDegreePlanInput = {
      id: "bs-computer-science",
      code: "BSCS",
      name: "Bachelor of Science in Computer Science",
      description: "WGU's computer science degree program",
      level: "bachelor" as const,
      college: "College of Information Technology",
      totalUnits: 122,
      courses: [
        {courseCode: "C172", type: "core" as const, term: 1},
        {courseCode: "C175", type: "core" as const, term: 1},
      ],
    };

    test("should upsert a valid degree plan", async () => {
      const result = await adminResolvers.Mutation.upsertDegreePlan(
        null,
        {input: validDegreePlanInput},
        adminContext
      );

      expect(result).toMatchObject({
        degreeId: validDegreePlanInput.id,
        name: validDegreePlanInput.name,
        totalUnits: validDegreePlanInput.totalUnits,
      });
    });

    test("should reject invalid degree ID format", async () => {
      const invalidInput = {
        ...validDegreePlanInput,
        id: "BS_Computer_Science", // Should be kebab-case
      };

      await expect(
        adminResolvers.Mutation.upsertDegreePlan(
          null,
          {input: invalidInput},
          adminContext
        )
      ).rejects.toThrow(/Degree program ID must be in kebab-case/);
    });

    test("should reject invalid total units", async () => {
      const invalidInput = {
        ...validDegreePlanInput,
        totalUnits: 50, // Minimum is 60
      };

      await expect(
        adminResolvers.Mutation.upsertDegreePlan(
          null,
          {input: invalidInput},
          adminContext
        )
      ).rejects.toThrow(/Total units must be at least 60/);
    });
  });

  describe("Query Resolvers", () => {
    beforeEach(async () => {
      // Seed some test data
      const discordServer = {
        id: "123456789012345678",
        name: "Test Discord",
        inviteUrl: "https://discord.gg/test",
        tags: ["test"],
        verified: true,
        lastUpdated: new Date(),
      };
      await defaultDb.collection(COLLECTIONS.DISCORD_SERVERS)
        .doc(discordServer.id)
        .set(discordServer);

      const course = {
        courseCode: "C172",
        name: "Network Foundations",
        units: 3,
        level: "undergraduate",
        lastUpdated: new Date(),
      };
      await defaultDb.collection(COLLECTIONS.COURSES)
        .doc(course.courseCode)
        .set(course);
    });

    test("should list Discord servers with pagination", async () => {
      const result = await adminResolvers.Query.discordServers(
        null,
        {limit: 10, offset: 0}
      );

      expect(result.totalCount).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].serverId).toBe("123456789012345678");
    });

    test("should list courses", async () => {
      const result = await adminResolvers.Query.courses(
        null,
        {limit: 10, offset: 0}
      );

      expect(result.totalCount).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].courseCode).toBe("C172");
    });

    test("should get ingestion stats", async () => {
      const stats = await adminResolvers.Query.ingestionStats();

      expect(stats).toMatchObject({
        discordServers: 1,
        redditCommunities: 0,
        courses: 1,
        degreePlans: 0,
      });
      expect(stats.lastUpdated).toBeDefined();
    });
  });
});

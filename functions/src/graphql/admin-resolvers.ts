import {GraphQLError} from "graphql";
import {searchResolver} from "./search-resolver";
import {searchSubredditsResolver} from "./reddit-search-resolver";
import {defaultDb, adminDb} from "../lib/firebase-admin-db.js";
import {
  COLLECTIONS,
  DiscordServer,
  RedditCommunity,
  Course,
  DegreeProgram,
} from "../lib/data-model.js";
import {
  validateDiscordServerInput,
  validateDiscordServerUpdateInput,
  validateRedditCommunityInput,
  validateRedditCommunityUpdateInput,
  validateCourseInput,
  validateDegreePlanInput,
} from "../lib/validation-schemas.js";

// Helper function to validate admin permissions
function requireAdmin(context: { user: any }) {
  if (!context.user) {
    throw new GraphQLError("Authentication required", {
      extensions: {code: "UNAUTHENTICATED"},
    });
  }

  if (!context.user.admin) {
    throw new GraphQLError("Admin privileges required", {
      extensions: {code: "FORBIDDEN"},
    });
  }
}

// Helper function to log changes
async function logChange(
  action: "CREATE" | "UPDATE" | "DELETE",
  collection: string,
  documentId: string,
  changes: { before?: any; after?: any; changedFields?: string[] },
  userId: string,
  userEmail: string,
  source = "admin-api"
) {
  await adminDb.collection("change-history").add({
    action,
    collection,
    documentId,
    changes,
    performedBy: {
      userId,
      email: userEmail,
    },
    performedAt: new Date(),
    source,
  });
}

// Query resolvers
async function coursesResolver(_parent: any, args: { limit?: number; offset?: number }) {
  const {limit = 50, offset = 0} = args;

  try {
    const query = defaultDb.collection(COLLECTIONS.COURSES)
      .orderBy("lastUpdated", "desc")
      .limit(limit)
      .offset(offset);

    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => ({
      ...doc.data(),
      courseCode: doc.id,
    }));

    // Get total count (in production, this would be cached)
    const totalSnapshot = await defaultDb.collection(COLLECTIONS.COURSES).get();
    const totalCount = totalSnapshot.size;

    return {items, totalCount};
  } catch (error: any) {
    throw new GraphQLError(`Failed to fetch courses: ${error.message}`);
  }
}

async function degreePlansResolver(_parent: any, args: { limit?: number; offset?: number }) {
  const {limit = 50, offset = 0} = args;

  try {
    const query = defaultDb.collection(COLLECTIONS.DEGREE_PROGRAMS)
      .orderBy("lastUpdated", "desc")
      .limit(limit)
      .offset(offset);

    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => ({
      ...doc.data(),
      degreeId: doc.id,
    }));

    // Get total count
    const totalSnapshot = await defaultDb.collection(COLLECTIONS.DEGREE_PROGRAMS).get();
    const totalCount = totalSnapshot.size;

    return {items, totalCount};
  } catch (error: any) {
    throw new GraphQLError(`Failed to fetch degree plans: ${error.message}`);
  }
}

// Admin-only resolvers
async function discordServersResolver(_parent: any, args: { limit?: number; offset?: number }) {
  const {limit = 50, offset = 0} = args;

  try {
    const query = defaultDb.collection(COLLECTIONS.DISCORD_SERVERS)
      .orderBy("lastUpdated", "desc")
      .limit(limit)
      .offset(offset);

    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => ({
      ...doc.data(),
      serverId: doc.id,
    }));

    // Get total count
    const totalSnapshot = await defaultDb.collection(COLLECTIONS.DISCORD_SERVERS).get();
    const totalCount = totalSnapshot.size;

    return {items, totalCount};
  } catch (error: any) {
    throw new GraphQLError(`Failed to fetch Discord servers: ${error.message}`);
  }
}

async function redditCommunitiesResolver(_parent: any, args: { limit?: number; offset?: number }) {
  const {limit = 50, offset = 0} = args;

  try {
    const query = defaultDb.collection(COLLECTIONS.REDDIT_COMMUNITIES)
      .orderBy("lastUpdated", "desc")
      .limit(limit)
      .offset(offset);

    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => ({
      ...doc.data(),
      subredditName: doc.id,
    }));

    // Get total count
    const totalSnapshot = await defaultDb.collection(COLLECTIONS.REDDIT_COMMUNITIES).get();
    const totalCount = totalSnapshot.size;

    return {items, totalCount};
  } catch (error: any) {
    throw new GraphQLError(`Failed to fetch Reddit communities: ${error.message}`);
  }
}

async function ingestionStatsResolver() {
  try {
    // Get collection counts in parallel
    const [discordSnapshot, redditSnapshot, coursesSnapshot, degreeSnapshot] = await Promise.all([
      defaultDb.collection(COLLECTIONS.DISCORD_SERVERS).get(),
      defaultDb.collection(COLLECTIONS.REDDIT_COMMUNITIES).get(),
      defaultDb.collection(COLLECTIONS.COURSES).get(),
      defaultDb.collection(COLLECTIONS.DEGREE_PROGRAMS).get(),
    ]);

    return {
      discordServers: discordSnapshot.size,
      redditCommunities: redditSnapshot.size,
      courses: coursesSnapshot.size,
      degreePlans: degreeSnapshot.size,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new GraphQLError(`Failed to calculate ingestion stats: ${error.message}`);
  }
}

// Mutation resolvers
async function ingestDiscordServerResolver(
  _parent: any,
  args: { input: any },
  context: { user: any }
) {
  requireAdmin(context);

  try {
    // Validate input using Zod schema
    const validatedInput = validateDiscordServerInput(args.input);

    const serverData: DiscordServer = {
      id: validatedInput.serverId,
      name: validatedInput.name,
      description: validatedInput.description ?? undefined,
      inviteUrl: validatedInput.inviteUrl,
      memberCount: validatedInput.memberCount ?? undefined,
      channels: validatedInput.channels || [],
      tags: validatedInput.tags,
      verified: validatedInput.verified,
      lastUpdated: new Date(),
    };

    // Save to Firestore
    await defaultDb
      .collection(COLLECTIONS.DISCORD_SERVERS)
      .doc(validatedInput.serverId)
      .set(serverData);

    // Log the change
    await logChange(
      "CREATE",
      COLLECTIONS.DISCORD_SERVERS,
      validatedInput.serverId,
      {after: serverData},
      context.user.uid,
      context.user.email
    );

    return {...serverData, serverId: validatedInput.serverId};
  } catch (error: any) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Failed to ingest Discord server: ${error.message}`);
  }
}

async function updateDiscordServerResolver(
  _parent: any,
  args: { id: string; input: any },
  context: { user: any }
) {
  requireAdmin(context);
  const {id} = args;

  try {
    // Validate input using Zod schema
    const validatedInput = validateDiscordServerUpdateInput(args.input);
    const docRef = defaultDb.collection(COLLECTIONS.DISCORD_SERVERS).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new GraphQLError(`Discord server with ID ${id} not found`);
    }

    const currentData = doc.data() as DiscordServer;
    const updatedData = {
      ...currentData,
      ...validatedInput,
      lastUpdated: new Date(),
    };

    // Update in Firestore
    await docRef.set(updatedData, {merge: true});

    // Log the change
    await logChange(
      "UPDATE",
      COLLECTIONS.DISCORD_SERVERS,
      id,
      {before: currentData, after: updatedData},
      context.user.uid,
      context.user.email
    );

    return {...updatedData, serverId: id};
  } catch (error: any) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Failed to update Discord server: ${error.message}`);
  }
}

async function deleteDiscordServerResolver(
  _parent: any,
  args: { id: string },
  context: { user: any }
) {
  requireAdmin(context);
  const {id} = args;

  try {
    const docRef = defaultDb.collection(COLLECTIONS.DISCORD_SERVERS).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new GraphQLError(`Discord server with ID ${id} not found`);
    }

    const serverData = doc.data() as DiscordServer;

    // Delete from Firestore
    await docRef.delete();

    // Log the change
    await logChange(
      "DELETE",
      COLLECTIONS.DISCORD_SERVERS,
      id,
      {before: serverData},
      context.user.uid,
      context.user.email
    );

    return true;
  } catch (error: any) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Failed to delete Discord server: ${error.message}`);
  }
}

async function ingestRedditCommunityResolver(
  _parent: any,
  args: { input: any },
  context: { user: any }
) {
  requireAdmin(context);

  try {
    // Validate input using Zod schema
    const validatedInput = validateRedditCommunityInput(args.input);

    const communityData: RedditCommunity = {
      id: validatedInput.subreddit,
      name: validatedInput.name,
      description: validatedInput.description ?? undefined,
      url: validatedInput.url,
      subscriberCount: validatedInput.subscriberCount ?? undefined,
      type: validatedInput.type,
      associatedPrograms: validatedInput.associatedPrograms,
      associatedCourses: validatedInput.associatedCourses,
      tags: validatedInput.tags,
      active: validatedInput.active,
      lastUpdated: new Date(),
    };

    // Save to Firestore
    await defaultDb
      .collection(COLLECTIONS.REDDIT_COMMUNITIES)
      .doc(validatedInput.subreddit)
      .set(communityData);

    // Log the change
    await logChange(
      "CREATE",
      COLLECTIONS.REDDIT_COMMUNITIES,
      validatedInput.subreddit,
      {after: communityData},
      context.user.uid,
      context.user.email
    );

    return {...communityData, subredditName: validatedInput.subreddit};
  } catch (error: any) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Failed to ingest Reddit community: ${error.message}`);
  }
}

async function updateRedditCommunityResolver(
  _parent: any,
  args: { id: string; input: any },
  context: { user: any }
) {
  requireAdmin(context);
  const {id} = args;

  try {
    // Validate input using Zod schema
    const validatedInput = validateRedditCommunityUpdateInput(args.input);
    const docRef = defaultDb.collection(COLLECTIONS.REDDIT_COMMUNITIES).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new GraphQLError(`Reddit community with ID ${id} not found`);
    }

    const currentData = doc.data() as RedditCommunity;
    const updatedData = {
      ...currentData,
      ...validatedInput,
      lastUpdated: new Date(),
    };

    // Update in Firestore
    await docRef.set(updatedData, {merge: true});

    // Log the change
    await logChange(
      "UPDATE",
      COLLECTIONS.REDDIT_COMMUNITIES,
      id,
      {before: currentData, after: updatedData},
      context.user.uid,
      context.user.email
    );

    return {...updatedData, subredditName: id};
  } catch (error: any) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Failed to update Reddit community: ${error.message}`);
  }
}

async function deleteRedditCommunityResolver(
  _parent: any,
  args: { id: string },
  context: { user: any }
) {
  requireAdmin(context);
  const {id} = args;

  try {
    const docRef = defaultDb.collection(COLLECTIONS.REDDIT_COMMUNITIES).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new GraphQLError(`Reddit community with ID ${id} not found`);
    }

    const communityData = doc.data() as RedditCommunity;

    // Delete from Firestore
    await docRef.delete();

    // Log the change
    await logChange(
      "DELETE",
      COLLECTIONS.REDDIT_COMMUNITIES,
      id,
      {before: communityData},
      context.user.uid,
      context.user.email
    );

    return true;
  } catch (error: any) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Failed to delete Reddit community: ${error.message}`);
  }
}

async function upsertCourseResolver(_parent: any, args: { input: any }, context: { user: any }) {
  requireAdmin(context);

  try {
    // Validate input using Zod schema
    const validatedInput = validateCourseInput(args.input);

    const docRef = defaultDb.collection(COLLECTIONS.COURSES).doc(validatedInput.courseCode);
    const existingDoc = await docRef.get();
    const isUpdate = existingDoc.exists;
    const currentData = isUpdate ? existingDoc.data() as Course : null;

    const courseData: Course = {
      courseCode: validatedInput.courseCode,
      name: validatedInput.name,
      description: validatedInput.description ?? undefined,
      units: validatedInput.units,
      level: validatedInput.level,
      type: validatedInput.type,
      prerequisites: validatedInput.prerequisites,
      firstSeenCatalog: isUpdate ? currentData?.firstSeenCatalog || "manual-entry" : "manual-entry",
      lastSeenCatalog: "manual-entry",
      catalogHistory: isUpdate ? currentData?.catalogHistory || [] : [],
      communities: validatedInput.communities ? {
        discord: validatedInput.communities.discord || [],
        reddit: validatedInput.communities.reddit || [],
        wguConnect: validatedInput.communities.wguConnect ?? undefined,
      } : {
        discord: [],
        reddit: [],
        wguConnect: undefined,
      },
      popularityScore: validatedInput.popularityScore,
      difficultyRating: validatedInput.difficultyRating ?? undefined,
      lastUpdated: new Date(),
    };

    // Save to Firestore
    await docRef.set(courseData, {merge: true});

    // Log the change
    await logChange(
      isUpdate ? "UPDATE" : "CREATE",
      COLLECTIONS.COURSES,
      validatedInput.courseCode,
      {before: currentData, after: courseData},
      context.user.uid,
      context.user.email
    );

    return {...courseData};
  } catch (error: any) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Failed to upsert course: ${error.message}`);
  }
}

async function deleteCourseResolver(
  _parent: any,
  args: { courseCode: string },
  context: { user: any }
) {
  requireAdmin(context);
  const {courseCode} = args;

  try {
    const docRef = defaultDb.collection(COLLECTIONS.COURSES).doc(courseCode);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new GraphQLError(`Course with code ${courseCode} not found`);
    }

    const courseData = doc.data() as Course;

    // Delete from Firestore
    await docRef.delete();

    // Log the change
    await logChange(
      "DELETE",
      COLLECTIONS.COURSES,
      courseCode,
      {before: courseData},
      context.user.uid,
      context.user.email
    );

    return true;
  } catch (error: any) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Failed to delete course: ${error.message}`);
  }
}

async function upsertDegreePlanResolver(
  _parent: any,
  args: { input: any },
  context: { user: any }
) {
  requireAdmin(context);

  try {
    // Validate input using Zod schema
    const validatedInput = validateDegreePlanInput(args.input);

    const docRef = defaultDb.collection(COLLECTIONS.DEGREE_PROGRAMS).doc(validatedInput.id);
    const existingDoc = await docRef.get();
    const isUpdate = existingDoc.exists;
    const currentData = isUpdate ? existingDoc.data() as DegreeProgram : null;

    const degreePlanData: DegreeProgram = {
      id: validatedInput.id,
      code: validatedInput.code,
      name: validatedInput.name,
      description: validatedInput.description ?? undefined,
      level: validatedInput.level,
      college: validatedInput.college,
      totalUnits: validatedInput.totalUnits,
      courses: validatedInput.courses,
      firstSeenCatalog: isUpdate ? currentData?.firstSeenCatalog || "manual-entry" : "manual-entry",
      lastSeenCatalog: "manual-entry",
      catalogHistory: isUpdate ? currentData?.catalogHistory || [] : [],
      communities: validatedInput.communities || {
        discord: [],
        reddit: [],
      },
      stats: validatedInput.stats ?? undefined,
      lastUpdated: new Date(),
    };

    // Save to Firestore
    await docRef.set(degreePlanData, {merge: true});

    // Log the change
    await logChange(
      isUpdate ? "UPDATE" : "CREATE",
      COLLECTIONS.DEGREE_PROGRAMS,
      validatedInput.id,
      {before: currentData, after: degreePlanData},
      context.user.uid,
      context.user.email
    );

    return {...degreePlanData, degreeId: validatedInput.id};
  } catch (error: any) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Failed to upsert degree plan: ${error.message}`);
  }
}

async function deleteDegreePlanResolver(
  _parent: any,
  args: { id: string },
  context: { user: any }
) {
  requireAdmin(context);
  const {id} = args;

  try {
    const docRef = defaultDb.collection(COLLECTIONS.DEGREE_PROGRAMS).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new GraphQLError(`Degree plan with ID ${id} not found`);
    }

    const degreePlanData = doc.data() as DegreeProgram;

    // Delete from Firestore
    await docRef.delete();

    // Log the change
    await logChange(
      "DELETE",
      COLLECTIONS.DEGREE_PROGRAMS,
      id,
      {before: degreePlanData},
      context.user.uid,
      context.user.email
    );

    return true;
  } catch (error: any) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(`Failed to delete degree plan: ${error.message}`);
  }
}

export const adminResolvers = {
  Query: {
    ping: () => "pong",
    // Include all public resolvers
    search: searchResolver,
    searchSubreddits: searchSubredditsResolver,
    courses: coursesResolver,
    degreePlans: degreePlansResolver,
    // Admin-only resolvers
    discordServers: discordServersResolver,
    redditCommunities: redditCommunitiesResolver,
    ingestionStats: ingestionStatsResolver,
  },
  Mutation: {
    // Discord mutations
    ingestDiscordServer: ingestDiscordServerResolver,
    updateDiscordServer: updateDiscordServerResolver,
    deleteDiscordServer: deleteDiscordServerResolver,
    // Reddit mutations
    ingestRedditCommunity: ingestRedditCommunityResolver,
    updateRedditCommunity: updateRedditCommunityResolver,
    deleteRedditCommunity: deleteRedditCommunityResolver,
    // Course mutations
    upsertCourse: upsertCourseResolver,
    deleteCourse: deleteCourseResolver,
    // Degree plan mutations
    upsertDegreePlan: upsertDegreePlanResolver,
    deleteDegreePlan: deleteDegreePlanResolver,
  },
};

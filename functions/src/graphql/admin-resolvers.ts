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
import {AdminUser} from "../lib/auth.js";

// GraphQL context interfaces
interface GraphQLContext {
  user: AdminUser;
}

interface QueryArgs {
  limit?: number;
  offset?: number;
}

interface ChangeLog {
  before?: DiscordServer | RedditCommunity | Course | DegreeProgram;
  after?: DiscordServer | RedditCommunity | Course | DegreeProgram;
  changedFields?: string[];
}

interface DiscordServerInput {
  serverId: string;
  name: string;
  description?: string;
  inviteUrl: string;
  memberCount?: number;
  channels?: Array<{
    id: string;
    name: string;
    type: string;
    associatedCourses?: string[];
  }>;
  tags: string[];
  verified: boolean;
}

interface RedditCommunityInput {
  subreddit: string;
  name: string;
  description?: string;
  url: string;
  subscriberCount?: number;
  type: string;
  associatedPrograms: string[];
  associatedCourses: string[];
  tags: string[];
  active: boolean;
}

interface CourseInput {
  courseCode: string;
  name: string;
  description?: string;
  units: number;
  level: string;
  type: string;
  prerequisites: string[];
  communities?: {
    discord?: string[];
    reddit?: string[];
    wguConnect?: string;
  };
  popularityScore: number;
  difficultyRating?: number;
}

interface DegreePlanInput {
  id: string;
  code: string;
  name: string;
  description?: string;
  level: string;
  college: string;
  totalUnits: number;
  courses: Array<{
    courseCode: string;
    type: string;
    term?: number;
  }>;
  communities?: {
    discord: string[];
    reddit: string[];
  };
  stats?: {
    averageCompletionTime?: number;
    popularCourseSequences?: string[][];
  };
}

// Helper function to validate admin permissions
function requireAdmin(context: GraphQLContext) {
  if (!context.user) {
    throw new GraphQLError("Authentication required", {
      extensions: {code: "UNAUTHENTICATED"},
    });
  }

  if (context.user.role !== "admin") {
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
  changes: ChangeLog,
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
async function coursesResolver(_parent: unknown, args: QueryArgs) {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to fetch courses: ${errorMessage}`);
  }
}

async function degreePlansResolver(_parent: unknown, args: QueryArgs) {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to fetch degree plans: ${errorMessage}`);
  }
}

// Admin-only resolvers
async function discordServersResolver(_parent: unknown, args: QueryArgs) {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to fetch Discord servers: ${errorMessage}`);
  }
}

async function redditCommunitiesResolver(_parent: unknown, args: QueryArgs) {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to fetch Reddit communities: ${errorMessage}`);
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to calculate ingestion stats: ${errorMessage}`);
  }
}

// Mutation resolvers
async function ingestDiscordServerResolver(
  _parent: unknown,
  args: { input: DiscordServerInput },
  context: GraphQLContext
) {
  requireAdmin(context);

  try {
    // Validate input using Zod schema
    const validatedInput = validateDiscordServerInput(args.input);

    // Build server data object, excluding undefined values for Firestore compatibility
    const serverData: Partial<DiscordServer> = {
      id: validatedInput.serverId,
      name: validatedInput.name,
      inviteUrl: validatedInput.inviteUrl,
      channels: validatedInput.channels || [],
      tags: validatedInput.tags,
      verified: validatedInput.verified,
      lastUpdated: new Date(),
    };

    // Add optional fields only if they have values
    if (validatedInput.description !== undefined) {
      serverData.description = validatedInput.description;
    }
    if (validatedInput.memberCount !== undefined) {
      serverData.memberCount = validatedInput.memberCount;
    }

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
      {after: serverData as DiscordServer},
      context.user.uid,
      context.user.email
    );

    return serverData as DiscordServer;
  } catch (error: unknown) {
    if (error instanceof GraphQLError) throw error;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to ingest Discord server: ${errorMessage}`);
  }
}

async function updateDiscordServerResolver(
  _parent: unknown,
  args: { id: string; input: Partial<DiscordServerInput> },
  context: GraphQLContext
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
  } catch (error: unknown) {
    if (error instanceof GraphQLError) throw error;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to update Discord server: ${errorMessage}`);
  }
}

async function deleteDiscordServerResolver(
  _parent: unknown,
  args: { id: string },
  context: GraphQLContext
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
  } catch (error: unknown) {
    if (error instanceof GraphQLError) throw error;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to delete Discord server: ${errorMessage}`);
  }
}

async function ingestRedditCommunityResolver(
  _parent: unknown,
  args: { input: RedditCommunityInput },
  context: GraphQLContext
) {
  requireAdmin(context);

  try {
    // Validate input using Zod schema
    const validatedInput = validateRedditCommunityInput(args.input);

    // Build community data object, excluding undefined values for Firestore compatibility
    const communityData: Partial<RedditCommunity> = {
      id: validatedInput.subreddit,
      name: validatedInput.name,
      url: validatedInput.url,
      type: validatedInput.type,
      associatedPrograms: validatedInput.associatedPrograms,
      associatedCourses: validatedInput.associatedCourses,
      tags: validatedInput.tags,
      active: validatedInput.active,
      lastUpdated: new Date(),
    };

    // Add optional fields only if they have values
    if (validatedInput.description !== undefined) {
      communityData.description = validatedInput.description;
    }
    if (validatedInput.subscriberCount !== undefined) {
      communityData.subscriberCount = validatedInput.subscriberCount;
    }

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
      {after: communityData as RedditCommunity},
      context.user.uid,
      context.user.email
    );

    return communityData as RedditCommunity;
  } catch (error: unknown) {
    if (error instanceof GraphQLError) throw error;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to ingest Reddit community: ${errorMessage}`);
  }
}

async function updateRedditCommunityResolver(
  _parent: unknown,
  args: { id: string; input: Partial<RedditCommunityInput> },
  context: GraphQLContext
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
  } catch (error: unknown) {
    if (error instanceof GraphQLError) throw error;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to update Reddit community: ${errorMessage}`);
  }
}

async function deleteRedditCommunityResolver(
  _parent: unknown,
  args: { id: string },
  context: GraphQLContext
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
  } catch (error: unknown) {
    if (error instanceof GraphQLError) throw error;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to delete Reddit community: ${errorMessage}`);
  }
}

async function upsertCourseResolver(
  _parent: unknown,
  args: { input: CourseInput },
  context: GraphQLContext
) {
  requireAdmin(context);

  try {
    // Validate input using Zod schema
    const validatedInput = validateCourseInput(args.input);

    const docRef = defaultDb.collection(COLLECTIONS.COURSES).doc(validatedInput.courseCode);
    const existingDoc = await docRef.get();
    const isUpdate = existingDoc.exists;
    const currentData = isUpdate ? existingDoc.data() as Course : null;

    // Build course data object, excluding undefined values for Firestore compatibility
    const courseData: Partial<Course> = {
      courseCode: validatedInput.courseCode,
      name: validatedInput.name,
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
        ...(validatedInput.communities.wguConnect && { wguConnect: validatedInput.communities.wguConnect }),
      } : {
        discord: [],
        reddit: [],
      },
      popularityScore: validatedInput.popularityScore,
      lastUpdated: new Date(),
    };

    // Add optional fields only if they have values
    if (validatedInput.description !== undefined) {
      courseData.description = validatedInput.description;
    }
    if (validatedInput.difficultyRating !== undefined) {
      courseData.difficultyRating = validatedInput.difficultyRating;
    }

    // Save to Firestore
    await docRef.set(courseData, {merge: true});

    // Log the change
    await logChange(
      isUpdate ? "UPDATE" : "CREATE",
      COLLECTIONS.COURSES,
      validatedInput.courseCode,
      {before: currentData, after: courseData as Course},
      context.user.uid,
      context.user.email
    );

    return courseData as Course;
  } catch (error: unknown) {
    if (error instanceof GraphQLError) throw error;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to upsert course: ${errorMessage}`);
  }
}

async function deleteCourseResolver(
  _parent: unknown,
  args: { courseCode: string },
  context: GraphQLContext
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
  } catch (error: unknown) {
    if (error instanceof GraphQLError) throw error;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to delete course: ${errorMessage}`);
  }
}

async function upsertDegreePlanResolver(
  _parent: unknown,
  args: { input: DegreePlanInput },
  context: GraphQLContext
) {
  requireAdmin(context);

  try {
    // Validate input using Zod schema
    const validatedInput = validateDegreePlanInput(args.input);

    const docRef = defaultDb.collection(COLLECTIONS.DEGREE_PROGRAMS).doc(validatedInput.id);
    const existingDoc = await docRef.get();
    const isUpdate = existingDoc.exists;
    const currentData = isUpdate ? existingDoc.data() as DegreeProgram : null;

    // Build degree plan data object, excluding undefined values for Firestore compatibility
    const degreePlanData: Partial<DegreeProgram> = {
      id: validatedInput.id,
      code: validatedInput.code,
      name: validatedInput.name,
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
      lastUpdated: new Date(),
    };

    // Add optional fields only if they have values
    if (validatedInput.description !== undefined) {
      degreePlanData.description = validatedInput.description;
    }
    if (validatedInput.stats !== undefined) {
      degreePlanData.stats = validatedInput.stats;
    }

    // Save to Firestore
    await docRef.set(degreePlanData, {merge: true});

    // Log the change
    await logChange(
      isUpdate ? "UPDATE" : "CREATE",
      COLLECTIONS.DEGREE_PROGRAMS,
      validatedInput.id,
      {before: currentData, after: degreePlanData as DegreeProgram},
      context.user.uid,
      context.user.email
    );

    return degreePlanData as DegreeProgram;
  } catch (error: unknown) {
    if (error instanceof GraphQLError) throw error;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to upsert degree plan: ${errorMessage}`);
  }
}

async function deleteDegreePlanResolver(
  _parent: unknown,
  args: { id: string },
  context: GraphQLContext
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
  } catch (error: unknown) {
    if (error instanceof GraphQLError) throw error;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new GraphQLError(`Failed to delete degree plan: ${errorMessage}`);
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

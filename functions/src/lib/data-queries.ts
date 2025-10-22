/**
 * Data Query Patterns
 *
 * Common query patterns for accessing WGU Extension data efficiently
 */

import {defaultDb as firestore} from "./firebase-admin-db";
import {FieldPath} from "firebase-admin/firestore";
import {
  COLLECTIONS,
  Course,
  DegreeProgram,
  DiscordServer,
  RedditCommunity,
  WguConnectGroup,
  StudentCourseView,
  CommunityResourceIndex,
  CourseCommunityMapping,
} from "./data-model";

// ==========================================
// COURSE QUERIES
// ==========================================

/**
 * Get complete course information with all communities
 * This is the main query for displaying course details to students
 */
export async function getCourseWithCommunities(courseCode: string): Promise<StudentCourseView | null> {
  // Get course
  const courseDoc = await firestore
    .collection(COLLECTIONS.COURSES)
    .doc(courseCode)
    .get();

  if (!courseDoc.exists) {
    return null;
  }

  const course = courseDoc.data() as Course;

  // Get community mapping
  const mappingDoc = await firestore
    .collection(COLLECTIONS.COURSE_MAPPINGS)
    .doc(courseCode)
    .get();

  const mapping = mappingDoc.exists ? mappingDoc.data() as CourseCommunityMapping : null;

  // Fetch all related communities in parallel
  const communityPromises = [];

  // WGU Connect
  if (mapping?.communities.all.find((c) => c.type === "wgu-connect")) {
    const wguConnectId = mapping.communities.all.find((c) => c.type === "wgu-connect")?.id;
    if (wguConnectId) {
      communityPromises.push(
        firestore.collection(COLLECTIONS.WGU_CONNECT_GROUPS).doc(wguConnectId).get()
      );
    }
  }

  // Discord servers
  const discordIds = mapping?.communities.all
    .filter((c) => c.type === "discord")
    .map((c) => c.id) || [];
  communityPromises.push(
    ...discordIds.map((id) =>
      firestore.collection(COLLECTIONS.DISCORD_SERVERS).doc(id).get()
    )
  );

  // Reddit communities
  const redditIds = mapping?.communities.all
    .filter((c) => c.type === "reddit")
    .map((c) => c.id) || [];
  communityPromises.push(
    ...redditIds.map((id) =>
      firestore.collection(COLLECTIONS.REDDIT_COMMUNITIES).doc(id).get()
    )
  );

  const communityDocs = await Promise.all(communityPromises);

  // Build the student view
  const view: StudentCourseView = {
    course,
    communities: {
      wguConnect: undefined,
      discord: [],
      reddit: [],
      studentGroups: [],
    },
  };

  // Process community results
  for (const doc of communityDocs) {
    if (!doc.exists) continue;

    const data = doc.data();
    if (data?.courseCode) {
      // WGU Connect
      view.communities.wguConnect = data as WguConnectGroup;
    } else if (data?.inviteUrl) {
      // Discord
      const server = data as DiscordServer;
      view.communities.discord.push({
        server,
        channels: server.channels?.filter((ch) =>
          ch.associatedCourses?.includes(courseCode)
        ),
      });
    } else if (data?.url && data?.subscriberCount !== undefined) {
      // Reddit
      view.communities.reddit.push({
        community: data as RedditCommunity,
        topPosts: mapping?.topRedditPosts,
      });
    }
  }

  return view;
}

/**
 * Search courses by name or code
 */
export async function searchCourses(query: string, limit = 10): Promise<Course[]> {
  const normalizedQuery = query.toUpperCase();

  // Try exact course code match first
  const exactMatch = await firestore
    .collection(COLLECTIONS.COURSES)
    .doc(normalizedQuery)
    .get();

  if (exactMatch.exists) {
    return [exactMatch.data() as Course];
  }

  // Firestore doesn't support full-text search, so we'd typically use:
  // 1. Algolia or Elasticsearch for full-text search
  // 2. Cloud Functions to maintain a search index
  // 3. Client-side filtering for small datasets

  // For now, fetch all and filter client-side (not scalable)
  const snapshot = await firestore
    .collection(COLLECTIONS.COURSES)
    .limit(100) // Limit to prevent excessive reads
    .get();

  const courses = snapshot.docs
    .map((doc) => doc.data() as Course)
    .filter((course) =>
      course.courseCode.includes(normalizedQuery) ||
      course.name.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, limit);

  return courses;
}

// ==========================================
// DEGREE PROGRAM QUERIES
// ==========================================

/**
 * Get degree program with all courses
 */
export async function getDegreeProgramWithCourses(programId: string): Promise<{
  program: DegreeProgram;
  courses: Course[];
} | null> {
  const programDoc = await firestore
    .collection(COLLECTIONS.DEGREE_PROGRAMS)
    .doc(programId)
    .get();

  if (!programDoc.exists) {
    return null;
  }

  const program = programDoc.data() as DegreeProgram;

  // Fetch all courses for this program
  const courseCodes = program.courses.map((c) => c.courseCode);
  const coursePromises = courseCodes.map((code) =>
    firestore.collection(COLLECTIONS.COURSES).doc(code).get()
  );

  const courseDocs = await Promise.all(coursePromises);
  const courses = courseDocs
    .filter((doc) => doc.exists)
    .map((doc) => doc.data() as Course);

  return {program, courses};
}

// ==========================================
// COMMUNITY QUERIES
// ==========================================

/**
 * Search communities by query
 */
export async function searchCommunities(
  query: string,
  filters?: {
    type?: "discord" | "reddit" | "wgu-connect" | "student-group";
    verified?: boolean;
    courseCodes?: string[];
  },
  limit = 20
): Promise<CommunityResourceIndex[]> {
  let q = firestore.collection(COLLECTIONS.COMMUNITY_INDEX)
    .orderBy("popularity", "desc");

  if (filters?.type) {
    q = q.where("type", "==", filters.type);
  }

  if (filters?.verified !== undefined) {
    q = q.where("verified", "==", filters.verified);
  }

  if (filters?.courseCodes?.length) {
    // Firestore limitation: can only use array-contains for one value
    q = q.where("courseCodes", "array-contains", filters.courseCodes[0]);
  }

  const snapshot = await q.limit(limit * 2).get(); // Get extra for client filtering

  // Client-side filtering for text search
  const results = snapshot.docs
    .map((doc) => doc.data() as CommunityResourceIndex)
    .filter((resource) => {
      const searchLower = query.toLowerCase();
      return (
        resource.title.toLowerCase().includes(searchLower) ||
        resource.description?.toLowerCase().includes(searchLower) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    })
    .slice(0, limit);

  return results;
}

/**
 * Get trending communities based on activity
 */
export async function getTrendingCommunities(limit = 10): Promise<{
  discord: DiscordServer[];
  reddit: RedditCommunity[];
}> {
  // Get most popular Discord servers
  const discordSnapshot = await firestore
    .collection(COLLECTIONS.DISCORD_SERVERS)
    .where("verified", "==", true)
    .orderBy("memberCount", "desc")
    .limit(limit)
    .get();

  const discord = discordSnapshot.docs.map((doc) => doc.data() as DiscordServer);

  // Get most active Reddit communities
  const redditSnapshot = await firestore
    .collection(COLLECTIONS.REDDIT_COMMUNITIES)
    .where("active", "==", true)
    .orderBy("subscriberCount", "desc")
    .limit(limit)
    .get();

  const reddit = redditSnapshot.docs.map((doc) => doc.data() as RedditCommunity);

  return {discord, reddit};
}

// ==========================================
// ANALYTICS QUERIES
// ==========================================

/**
 * Get course popularity rankings
 */
export async function getPopularCourses(
  options: {
    programId?: string;
    level?: "undergraduate" | "graduate";
    limit?: number;
  } = {}
): Promise<Array<Course & { enrollmentCount: number }>> {
  let query = firestore.collection(COLLECTIONS.COURSES);

  if (options.level) {
    query = query.where("level", "==", options.level) as any;
  }

  const snapshot = await query
    .orderBy("popularityScore", "desc")
    .limit(options.limit || 20)
    .get();

  // In a real implementation, we'd track enrollment data
  // For now, using popularity score as a proxy
  return snapshot.docs.map((doc) => ({
    ...doc.data() as Course,
    enrollmentCount: Math.floor((doc.data() as Course).popularityScore || 0 * 100),
  }));
}

// ==========================================
// BATCH QUERIES
// ==========================================

/**
 * Get multiple courses by IDs efficiently
 */
export async function getCoursesByIds(courseCodes: string[]): Promise<Course[]> {
  if (courseCodes.length === 0) return [];

  // Firestore has a limit of 10 for 'in' queries
  const chunks = [];
  for (let i = 0; i < courseCodes.length; i += 10) {
    chunks.push(courseCodes.slice(i, i + 10));
  }

  const promises = chunks.map((chunk) =>
    firestore
      .collection(COLLECTIONS.COURSES)
      .where(FieldPath.documentId(), "in", chunk)
      .get()
  );

  const snapshots = await Promise.all(promises);
  const courses: Course[] = [];

  for (const snapshot of snapshots) {
    courses.push(...snapshot.docs.map((doc) => doc.data() as Course));
  }

  return courses;
}

// ==========================================
// CACHE HELPERS
// ==========================================

/**
 * Get or set cached query result
 */
export async function getCachedOrFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlMinutes = 60
): Promise<T> {
  const cacheDoc = await firestore
    .collection(COLLECTIONS.CACHE)
    .doc(cacheKey)
    .get();

  if (cacheDoc.exists) {
    const cache = cacheDoc.data();
    const expiresAt = cache?.expiresAt?.toDate();

    if (cache && expiresAt && expiresAt > new Date()) {
      return cache.data as T;
    }
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache the result
  await firestore
    .collection(COLLECTIONS.CACHE)
    .doc(cacheKey)
    .set({
      data,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
      createdAt: new Date(),
    });

  return data;
}

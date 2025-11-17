/**
 * Data Transformation Pipeline
 *
 * Transforms core data into derived collections for efficient querying
 */

import {getFirestore} from "firebase-admin/firestore";
import {initializeApp, getApps} from "firebase-admin/app";

// Initialize Firestore with emulator support
function getDb() {
  if (!getApps().length) {
    initializeApp({
      projectId: process.env.GCLOUD_PROJECT || "wgu-extension-site-prod",
    });
  }
  return getFirestore();
}

const firestore = getDb();
import {
  COLLECTIONS,
  Course,
  InstitutionCatalog,
  DiscordServer,
  RedditCommunity,
  CommunityResourceIndex,
  CourseCommunityMapping,
  TransformationJob,
} from "./data-model.js";

// ==========================================
// TRANSFORMATION FUNCTIONS
// ==========================================

/**
 * Extract courses from institution catalogs
 * Creates/updates the courses collection
 * @param {string} catalogId - The catalog ID to transform
 * @return {Promise<void>}
 */
export async function transformCatalogToCourses(catalogId: string): Promise<void> {
  const catalogDoc = await firestore
    .collection(COLLECTIONS.INSTITUTION_CATALOGS)
    .doc(catalogId)
    .get();

  if (!catalogDoc.exists) {
    throw new Error(`Catalog ${catalogId} not found`);
  }

  const catalog = catalogDoc.data() as InstitutionCatalog;
  const batch = firestore.batch();

  // Extract courses from catalog raw data
  // This is a simplified example - actual implementation would parse the catalog structure
  const courses = extractCoursesFromCatalog(catalog);

  for (const course of courses) {
    const courseRef = firestore.collection(COLLECTIONS.COURSES).doc(course.courseCode || "");
    const existingDoc = await courseRef.get();

    if (existingDoc.exists) {
      // Update existing course
      const existing = existingDoc.data() as Course;
      batch.update(courseRef, {
        ...course,
        firstSeenCatalog: existing.firstSeenCatalog,
        lastSeenCatalog: catalogId,
        catalogHistory: [...existing.catalogHistory, {
          catalogId,
          changes: detectCourseChanges(existing, course as Course),
        }],
        lastUpdated: new Date(),
      });
    } else {
      // Create new course
      batch.set(courseRef, {
        ...course,
        firstSeenCatalog: catalogId,
        lastSeenCatalog: catalogId,
        catalogHistory: [{catalogId}],
        communities: {discord: [], reddit: []},
        lastUpdated: new Date(),
      });
    }
  }

  await batch.commit();
}

/**
 * Map communities to courses
 * Creates associations between courses and relevant communities
 */
export async function mapCommunitiesToCourses(): Promise<void> {
  // Get all courses
  const coursesSnapshot = await firestore.collection(COLLECTIONS.COURSES).get();
  const courses = coursesSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      courseCode: doc.id,
    } as Course;
  });

  // Get all communities
  const [discordServers, redditCommunities, wguConnectGroups] = await Promise.all([
    firestore.collection(COLLECTIONS.DISCORD_SERVERS).get(),
    firestore.collection(COLLECTIONS.REDDIT_COMMUNITIES).get(),
    firestore.collection(COLLECTIONS.WGU_CONNECT_GROUPS).get(),
  ]);

  const batch = firestore.batch();

  for (const course of courses) {
    const mapping: CourseCommunityMapping = {
      courseCode: course.courseCode,
      communities: {
        primary: null as any,
        all: [],
      },
      lastUpdated: new Date(),
    };

    // Map WGU Connect (highest confidence - official)
    const wguConnect = wguConnectGroups.docs.find((doc) =>
      doc.data().courseCode === course.courseCode
    );
    if (wguConnect) {
      mapping.communities.all.push({
        type: "wgu-connect",
        id: wguConnect.id,
        relevance: "direct",
        confidence: 1.0,
      });
      mapping.communities.primary = {
        type: "wgu-connect",
        id: wguConnect.id,
        confidence: 1.0,
      };
    }

    // Map Discord channels
    for (const serverDoc of discordServers.docs) {
      const server = serverDoc.data() as DiscordServer;
      const relevantChannels = server.channels?.filter((ch) =>
        ch.associatedCourses?.includes(course.courseCode)
      ) || [];

      if (relevantChannels.length > 0) {
        mapping.communities.all.push({
          type: "discord",
          id: server.id,
          relevance: "direct",
          confidence: 0.9,
        });

        if (!mapping.communities.primary) {
          mapping.communities.primary = {
            type: "discord",
            id: server.id,
            confidence: 0.9,
          };
        }
      }
    }

    // Map Reddit communities
    for (const redditDoc of redditCommunities.docs) {
      const reddit = redditDoc.data() as RedditCommunity;

      // Direct course association
      if (reddit.associatedCourses?.includes(course.courseCode)) {
        mapping.communities.all.push({
          type: "reddit",
          id: reddit.id,
          relevance: "direct",
          confidence: 0.8,
        });
      } else if (reddit.type === "main" || reddit.type === "program-specific") {
        // Program-level association
        mapping.communities.all.push({
          type: "reddit",
          id: reddit.id,
          relevance: "program",
          confidence: 0.5,
        });
      }
    }

    // Save mapping
    const mappingRef = firestore
      .collection(COLLECTIONS.COURSE_MAPPINGS)
      .doc(course.courseCode);
    batch.set(mappingRef, mapping);
  }

  await batch.commit();
}

/**
 * Build search index for all community resources
 */
export async function buildCommunitySearchIndex(): Promise<void> {
  const batch = firestore.batch();

  // Index Discord servers
  const discordSnapshot = await firestore.collection(COLLECTIONS.DISCORD_SERVERS).get();
  for (const doc of discordSnapshot.docs) {
    const server = doc.data() as DiscordServer;
    const indexDoc: CommunityResourceIndex = {
      id: `discord_${server.id}`,
      type: "discord",
      resourceId: server.id,
      title: server.name,
      description: server.description,
      url: server.inviteUrl,
      courseCodes: extractAllCourseCodes(server),
      programIds: [], // Could be extracted from tags
      tags: server.tags,
      popularity: calculatePopularity(server),
      verified: server.verified,
      active: true,
      lastUpdated: new Date(),
    };

    const indexRef = firestore
      .collection(COLLECTIONS.COMMUNITY_INDEX)
      .doc(indexDoc.id);
    batch.set(indexRef, indexDoc);
  }

  // Index Reddit communities
  const redditSnapshot = await firestore.collection(COLLECTIONS.REDDIT_COMMUNITIES).get();
  for (const doc of redditSnapshot.docs) {
    const reddit = doc.data() as RedditCommunity;
    const indexDoc: CommunityResourceIndex = {
      id: `reddit_${reddit.id}`,
      type: "reddit",
      resourceId: reddit.id,
      title: reddit.name,
      description: reddit.description,
      url: reddit.url,
      courseCodes: reddit.associatedCourses || [],
      programIds: reddit.associatedPrograms || [],
      tags: reddit.tags,
      popularity: reddit.subscriberCount || 0,
      verified: false, // Reddit communities aren't "verified"
      active: reddit.active,
      lastUpdated: new Date(),
    };

    const indexRef = firestore
      .collection(COLLECTIONS.COMMUNITY_INDEX)
      .doc(indexDoc.id);
    batch.set(indexRef, indexDoc);
  }

  await batch.commit();
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function extractCoursesFromCatalog(catalog: InstitutionCatalog): Partial<Course>[] {
  // This would parse the actual catalog structure
  // For now, returning a simplified example
  const rawCourses = catalog.rawData?.courses || [];

  return rawCourses.map((rawCourse: any) => ({
    courseCode: rawCourse.code,
    name: rawCourse.name,
    description: rawCourse.description,
    units: rawCourse.creditUnits || rawCourse.competencyUnits,
    level: rawCourse.level?.toLowerCase() === "graduate" ? "graduate" : "undergraduate",
    type: determineTypeFromLevel(),
    prerequisites: rawCourse.prerequisites || [],
  }));
}

function detectCourseChanges(oldCourse: Course, newCourse: Partial<Course>): string[] {
  const changes: string[] = [];

  if (oldCourse.name !== newCourse.name) {
    changes.push(`Name changed from "${oldCourse.name}" to "${newCourse.name}"`);
  }
  if (oldCourse.units !== newCourse.units) {
    changes.push(`Units changed from ${oldCourse.units} to ${newCourse.units}`);
  }
  if (oldCourse.description !== newCourse.description) {
    changes.push("Description updated");
  }

  return changes;
}

function extractAllCourseCodes(server: DiscordServer): string[] {
  const codes = new Set<string>();

  server.channels?.forEach((channel) => {
    channel.associatedCourses?.forEach((code) => codes.add(code));
  });

  return Array.from(codes);
}

function calculatePopularity(server: DiscordServer): number {
  // Simple popularity score based on member count and activity
  const memberScore = Math.min(server.memberCount || 0, 10000) / 10000;
  const channelScore = Math.min((server.channels?.length || 0) / 50, 1);
  const verifiedBonus = server.verified ? 0.2 : 0;

  return (memberScore * 0.6 + channelScore * 0.2 + verifiedBonus) * 100;
}

function determineTypeFromLevel(): "general" | "major" | "elective" {
  // This would have actual logic based on course codes or catalog data
  return "major";
}

// ==========================================
// TRANSFORMATION JOB MANAGEMENT
// ==========================================

export async function createTransformationJob(
  type: TransformationJob["type"],
  input: TransformationJob["input"]
): Promise<string> {
  const job: TransformationJob = {
    id: firestore.collection(COLLECTIONS.TRANSFORMATION_JOBS).doc().id,
    type,
    status: "pending",
    input,
  };

  await firestore
    .collection(COLLECTIONS.TRANSFORMATION_JOBS)
    .doc(job.id)
    .set(job);

  return job.id;
}

export async function runTransformationPipeline(): Promise<void> {
  console.log("Starting transformation pipeline...");

  // 1. Transform latest catalog to courses
  const latestCatalog = await getLatestCatalog();
  if (latestCatalog) {
    console.log(`Transforming catalog ${latestCatalog.id}...`);
    await transformCatalogToCourses(latestCatalog.id);
  }

  // 2. Map communities to courses
  console.log("Mapping communities to courses...");
  await mapCommunitiesToCourses();

  // 3. Build search index
  console.log("Building community search index...");
  await buildCommunitySearchIndex();

  console.log("Transformation pipeline complete!");
}

async function getLatestCatalog(): Promise<{ id: string } | null> {
  const snapshot = await firestore
    .collection(COLLECTIONS.INSTITUTION_CATALOGS)
    .orderBy("date", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return {id: snapshot.docs[0].id};
}

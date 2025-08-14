#!/usr/bin/env tsx
/**
 * Seed Firestore emulator with real data for GraphQL search testing
 */
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {readFileSync, existsSync} from "fs";
import {resolve} from "path";

// Initialize Firebase Admin with emulator
// Use environment variable if set, otherwise default to 8181 (standard emulator port)
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8181";
}
initializeApp({projectId: "wgu-extension-site-prod"});

const db = getFirestore();

// Helper function to remove undefined values from objects
function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  if (obj !== null && typeof obj === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
}

async function seedData() {
  console.log("🌱 Seeding Firestore emulator with production data...");

  // Load and seed courses as individual documents (Firestore best practice)
  const coursesPath = resolve(__dirname, "../../../data/catalogs/processed/courses.json");
  if (existsSync(coursesPath)) {
    console.log("📖 Loading production courses data (individual documents)...");
    const fullCoursesData = JSON.parse(readFileSync(coursesPath, "utf-8"));

    const allCourses = fullCoursesData.courses || {};
    const courseKeys = Object.keys(allCourses);

    // Store each course as an individual document in courses collection
    let totalSeeded = 0;
    const batchSize = 500; // Firestore batch limit

    for (let i = 0; i < courseKeys.length; i += batchSize) {
      const batch = db.batch();
      const batchKeys = courseKeys.slice(i, i + batchSize);

      for (const courseCode of batchKeys) {
        const courseDoc = db.collection("courses").doc(courseCode);
        batch.set(courseDoc, {
          ...allCourses[courseCode],
          _metadata: {
            sourceCollection: "academic-registry/courses",
            lastUpdated: new Date().toISOString(),
          },
        });
      }

      await batch.commit();
      totalSeeded += batchKeys.length;
      console.log(`   📚 Batch ${Math.floor(i / batchSize) + 1}: ${batchKeys.length} courses`);
    }

    // Store metadata document for backward compatibility
    const metadataDoc = {
      metadata: {
        ...fullCoursesData.metadata,
        note: "Production data stored as individual documents in courses collection",
        storagePattern: "courses/{courseCode}",
        totalCourses: courseKeys.length,
      },
      courses: {}, // Empty - courses are individual documents
      _redirect: "courses", // Indicates data is in courses collection
    };

    await db.collection("academic-registry").doc("courses").set(metadataDoc);

    console.log(`✅ Seeded ${totalSeeded} courses as individual documents in courses collection`);
    console.log("   ℹ️  GraphQL resolver should use collection group queries for optimal performance");
  } else {
    console.log("⚠️  Production courses data not found at " + coursesPath);
  }

  // Load and seed academic-registry/degree-programs - Production format
  const programsPath = resolve(__dirname, "../../../data/catalogs/processed/degree-programs.json");
  if (existsSync(programsPath)) {
    console.log("📖 Loading production degree programs data...");
    const programsData = JSON.parse(readFileSync(programsPath, "utf-8"));

    // Store in production format: academic-registry/degree-programs document
    await db.collection("academic-registry").doc("degree-programs").set(programsData);
    console.log(`✅ Seeded ${programsData.metadata?.totalPrograms || "unknown"} degree programs in academic-registry/degree-programs`);
  } else {
    console.log("⚠️  Production degree programs data not found at " + programsPath);
  }

  // Load and seed Discord servers - Production data
  const discordPath = resolve(__dirname, "../../../data/discord/processed/communities.json");
  if (existsSync(discordPath)) {
    console.log("📖 Loading production Discord communities data...");
    const discordData = JSON.parse(readFileSync(discordPath, "utf-8"));
    const communities = Object.values(discordData.communities || {}) as any[];

    // Clear existing Discord servers
    const discordDocs = await db.collection("discord-servers").get();
    const batch = db.batch();
    discordDocs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    // Add Discord servers
    for (const community of communities) {
      const docData = removeUndefined({
        name: community.name,
        description: community.description,
        inviteUrl: community.inviteUrl,
        icon: community.icon,
        memberCount: community.memberCount,
        hierarchy: community.hierarchy,
        channelCounts: community.channelCounts,
        coursesMentioned: community.coursesMentioned,
        tags: community.tags,
      });

      await db.collection("discord-servers").doc(community.id).set(docData);
    }
    console.log(`✅ Seeded ${communities.length} Discord servers`);
  } else {
    console.log("⚠️  Production Discord data not found at ${discordPath}");
  }

  // Load and seed Reddit communities - Production data
  const redditPath = resolve(__dirname, "../../../data/reddit/processed/communities.json");
  if (existsSync(redditPath)) {
    console.log("📖 Loading production Reddit communities data...");
    const redditData = JSON.parse(readFileSync(redditPath, "utf-8"));
    const communities = redditData.communities || [];

    // Clear existing Reddit communities
    const redditDocs = await db.collection("reddit-communities").get();
    const batch2 = db.batch();
    redditDocs.forEach((doc) => batch2.delete(doc.ref));
    await batch2.commit();

    // Add Reddit communities
    for (const community of communities) {
      const docId = community.subreddit || community.name.replace("r/", "");
      const docData = removeUndefined({
        name: community.name,
        description: community.description,
        subreddit: community.subreddit,
        hierarchy: community.hierarchy,
        isActive: community.isActive,
        tags: community.tags,
        relevantCourses: community.relevantCourses,
        memberCount: community.memberCount,
        lastUpdated: community.lastUpdated,
        verified: community.verified,
      });
      await db.collection("reddit-communities").doc(docId).set(docData);
    }
    console.log(`✅ Seeded ${communities.length} Reddit communities`);
  } else {
    console.log("⚠️  Production Reddit data not found at ${redditPath}");
  }

  // Load and seed WGU Student Groups - Production data from raw files
  console.log("📖 Loading production WGU Student Groups data...");
  const studentGroupsRawPath = resolve(__dirname, "../../../data/wgu-student-groups/raw");
  const groups = [];

  if (existsSync(studentGroupsRawPath)) {
    // Load all raw student group files
    const files = [
      "cybersecurity-club.json",
      "alumni-cybersecurity-club.json",
      "ebony-owls-student-group.json",
      "english-learners-exchange.json",
      "latinx-owls-student-group.json",
      "nsls-at-wgu.json",
      "owl-parents-student-group.json",
      "pride-owls-student-group.json",
      "scta-wgu-chapters.json",
    ];

    for (const file of files) {
      const filePath = resolve(studentGroupsRawPath, file);
      if (existsSync(filePath)) {
        try {
          const data = JSON.parse(readFileSync(filePath, "utf-8"));
          const groupData = removeUndefined({
            name: data.name,
            courseCode: data.courseCode || null,
            url: data.url,
            description: data.description,
            memberCount: data.memberCount,
            category: data.category,
            tags: data.tags,
          });

          groups.push(groupData);
        } catch (error: any) {
          console.log(`⚠️  Error loading ${file}:`, error.message);
        }
      }
    }

    await db.collection("public").doc("wguStudentGroups").set({
      groups,
      byCategory: {},
      uploadedAt: new Date().toISOString(),
      metadata: {
        totalGroups: groups.length,
        lastUpdated: new Date().toISOString(),
      },
    });
    console.log(`✅ Seeded ${groups.length} WGU student groups`);
  } else {
    console.log("⚠️  Production WGU Student Groups data not found at ${studentGroupsRawPath}");
  }

  // Load and seed WGU Connect groups - Production data from raw files
  console.log("📖 Loading production WGU Connect groups data...");
  const connectRawPath = resolve(__dirname, "../../../data/wgu-connect/raw");
  let groupCount = 0;

  if (existsSync(connectRawPath)) {
    // Clear existing WGU Connect groups
    const connectDocs = await db.collection("wgu-connect-groups").get();
    const batch3 = db.batch();
    connectDocs.forEach((doc) => batch3.delete(doc.ref));
    await batch3.commit();

    // Load all WGU Connect raw files
    const files = [
      "c851d281-linux-foundations.json",
      "c950-data-structures-and-algorithms-ii.json",
      "c960-d422-discrete-math-and-logic.json",
      "d333-ethics-in-technology-.json",
      "d387-advanced-java.json",
      "d429-introduction-to-ai-for-computer-scientists.json",
      "d459-introduction-to-systems-thinking-and-applications.json",
      "d480-software-design-and-quality-assurance.json",
      "d682-ai-optimization-for-computer-scientists.json",
      "d684-intro-to-computer-science.json",
      "d685-practical-applications-of-prompt.json",
      "d686-operating-systems-for-computer-scientists.json",
    ];

    for (const file of files) {
      const filePath = resolve(connectRawPath, file);
      if (existsSync(filePath)) {
        try {
          const data = JSON.parse(readFileSync(filePath, "utf-8"));
          const docId = data.id || file.replace(".json", "");

          const connectGroupData = removeUndefined({
            name: data.name,
            description: data.description,
            memberCount: data.memberCount,
            courseCode: data.courseCode,
            url: data.url,
            resources: data.resources,
          });

          await db.collection("wgu-connect-groups").doc(docId).set(connectGroupData);
          groupCount++;
        } catch (error: any) {
          console.log(`⚠️  Error loading ${file}:`, error.message);
        }
      }
    }
    console.log(`✅ Seeded ${groupCount} WGU Connect groups`);
  } else {
    console.log("⚠️  Production WGU Connect data not found at ${connectRawPath}");
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\nTest queries:");
  console.log("- search(query: \"network\")");
  console.log("- search(query: \"C172\")");
  console.log("- search(query: \"cybersecurity\")");
  console.log("- search(query: \"web development\")");
  console.log("- search(query: \"data structures\")");
  console.log("- search(query: \"computer science\")");
}

seedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  });

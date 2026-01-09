#!/usr/bin/env tsx

/**
 * Analyze Firestore Relationships
 *
 * This script analyzes the current Firestore data to identify:
 * 1. What relationships exist between collections
 * 2. What relationships are missing
 * 3. Suggestions for improving integrated data
 */

import {initializeApp, cert} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import * as fs from "fs/promises";
import * as path from "path";

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error("❌ GOOGLE_APPLICATION_CREDENTIALS environment variable not set");
  process.exit(1);
}

const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, "utf8"));
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

interface RelationshipAnalysis {
  existingRelationships: Record<string, any>;
  missingRelationships: Record<string, any>;
  orphanedData: Record<string, any>;
  suggestions: string[];
}

async function analyzeRelationships(): Promise<RelationshipAnalysis> {
  console.log("🔍 Analyzing Firestore relationships...\n");

  const analysis: RelationshipAnalysis = {
    existingRelationships: {},
    missingRelationships: {},
    orphanedData: {},
    suggestions: [],
  };

  // 1. Fetch all courses
  console.log("📚 Fetching courses...");
  const coursesSnapshot = await db.collection("courses").get();
  const courseIds = new Set<string>();
  coursesSnapshot.forEach((doc) => courseIds.add(doc.id));
  console.log(`Found ${courseIds.size} courses`);

  // 2. Analyze Discord servers for course relationships
  console.log("\n💬 Analyzing Discord servers...");
  const discordSnapshot = await db.collection("discord-servers").get();
  let discordWithCourses = 0;
  let discordWithoutCourses = 0;

  discordSnapshot.forEach((doc) => {
    const server = doc.data();
    // Check if server has course tags or mentions
    const description = (server.description || "").toLowerCase();
    const name = (server.name || "").toLowerCase();

    // Try to extract course codes from text
    const coursePattern = /[A-Z]{1,4}\d{3,4}/g;
    const potentialCourses = [
      ...(description.match(coursePattern) || []),
      ...(name.match(coursePattern) || []),
    ].filter((code) => courseIds.has(code));

    if (potentialCourses.length > 0) {
      discordWithCourses++;
      if (!analysis.existingRelationships.discord) {
        analysis.existingRelationships.discord = {};
      }
      analysis.existingRelationships.discord[doc.id] = {
        courses: potentialCourses,
        serverName: server.name,
      };
    } else {
      discordWithoutCourses++;
    }
  });

  console.log(`Discord servers with course relationships: ${discordWithCourses}`);
  console.log(`Discord servers without course relationships: ${discordWithoutCourses}`);

  // 3. Analyze WGU Connect groups
  console.log("\n🔗 Analyzing WGU Connect groups...");
  const connectSnapshot = await db.collection("wgu-connect-groups").get();
  let connectWithCourses = 0;
  let connectOrphaned = 0;

  connectSnapshot.forEach((doc) => {
    const group = doc.data();
    const groupId = doc.id;

    // WGU Connect groups often have course codes in their IDs
    const courseMatch = groupId.match(/^([A-Z]{1,4}\d{3,4})/);
    if (courseMatch && courseIds.has(courseMatch[1])) {
      connectWithCourses++;
      if (!analysis.existingRelationships.wguConnect) {
        analysis.existingRelationships.wguConnect = {};
      }
      analysis.existingRelationships.wguConnect[groupId] = {
        courseCode: courseMatch[1],
        groupName: group.name,
      };
    } else {
      connectOrphaned++;
      if (!analysis.orphanedData.wguConnect) {
        analysis.orphanedData.wguConnect = [];
      }
      analysis.orphanedData.wguConnect.push({
        id: groupId,
        name: group.name,
      });
    }
  });

  console.log(`WGU Connect groups with course relationships: ${connectWithCourses}`);
  console.log(`WGU Connect groups without clear course relationships: ${connectOrphaned}`);

  // 4. Check degree programs
  console.log("\n🎓 Analyzing degree programs...");
  const academicDoc = await db.collection("academic-registry").doc("degree-programs").get();
  if (academicDoc.exists) {
    const data = academicDoc.data() || {};
    const programs = data.programs || {};
    let programCount = 0;
    const coursesInPrograms = new Set<string>();

    Object.entries(programs).forEach(([id, program]: [string, any]) => {
      programCount++;
      if (program.courses && Array.isArray(program.courses)) {
        program.courses.forEach((courseCode: string) => {
          if (courseIds.has(courseCode)) {
            coursesInPrograms.add(courseCode);
          } else {
            if (!analysis.missingRelationships.degreeProgramCourses) {
              analysis.missingRelationships.degreeProgramCourses = [];
            }
            analysis.missingRelationships.degreeProgramCourses.push({
              programId: id,
              missingCourse: courseCode,
            });
          }
        });
      }
    });

    console.log(`Degree programs analyzed: ${programCount}`);
    console.log(`Courses referenced in programs: ${coursesInPrograms.size}`);
    console.log(`Courses not in any program: ${courseIds.size - coursesInPrograms.size}`);
  }

  // 5. Generate suggestions
  analysis.suggestions = [
    "1. Create a \"course-communities\" collection to explicitly map courses to communities",
    "2. Add courseCode fields to Discord and Reddit collections where applicable",
    "3. Create a \"course-resources\" collection to aggregate all resources for each course",
    "4. Implement bidirectional references (courses should know their communities)",
    "5. Add tags/keywords to all collections for better cross-referencing",
    `6. ${discordWithoutCourses} Discord servers need course associations`,
    `7. ${connectOrphaned} WGU Connect groups may need manual course mapping`,
    "8. Consider creating a \"course-prerequisites\" collection for course relationships",
    "9. Add degree program references to courses for better navigation",
    "10. Create search indexes on course codes across all collections",
  ];

  return analysis;
}

async function main() {
  try {
    const analysis = await analyzeRelationships();

    // Save analysis to file
    const outputPath = path.join(process.cwd(), "firestore-relationship-analysis.json");
    await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));

    console.log("\n📊 Analysis Summary:");
    console.log("===================");
    console.log(`Existing relationships found: ${Object.keys(analysis.existingRelationships).length} types`);
    console.log(`Missing relationships identified: ${Object.keys(analysis.missingRelationships).length} types`);
    console.log(`Orphaned data collections: ${Object.keys(analysis.orphanedData).length}`);

    console.log("\n💡 Top Suggestions:");
    analysis.suggestions.slice(0, 5).forEach((suggestion, i) => {
      console.log(`   ${suggestion}`);
    });

    console.log(`\n✅ Full analysis saved to: ${outputPath}`);
  } catch (error) {
    console.error("❌ Error analyzing relationships:", error);
    process.exit(1);
  }
}

main();

#!/usr/bin/env tsx

/**
 * Populate Dev Cache from GraphQL API
 *
 * Downloads live data from the GraphQL API to populate the dev-cache
 * for local development without needing direct Firestore access.
 */

import fs from "fs/promises";
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// GraphQL endpoint - update this to your actual endpoint
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || "https://us-central1-wgu-extension.cloudfunctions.net/graphql/graphql";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function fetchGraphQL<T = any>(query: string): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({query}),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`);
  }

  if (!result.data) {
    throw new Error("No data returned from GraphQL query");
  }

  return result.data;
}

async function populateDevCache() {
  console.log("🔄 Populating dev-cache from GraphQL API...\n");
  console.log(`📡 Endpoint: ${GRAPHQL_ENDPOINT}\n`);

  // Ensure dev-cache directory exists
  const devCacheDir = path.join(rootDir, "dev-cache");
  await fs.mkdir(devCacheDir, {recursive: true});

  try {
    // Note: Since the resolvers return empty data for courses/degreePlans,
    // we'll use the search query to get all data by searching with empty string
    console.log("🔍 Fetching all data via search query...");

    // First, let's get ALL data with a higher limit
    const allDataQuery = `
      query GetAllData {
        search(query: "", limit: 5000) {
          results {
            type
            courseCode
            name
            url
            description
            icon
            platform
            memberCount
            competencyUnits
            college
            degreeType
            serverId
            subredditName
            groupId
            degreeId
            studentGroupId
          }
          totalCount
        }
      }
    `;

    const allData = await fetchGraphQL<{
      search: {
        results: Array<{
          type: string;
          courseCode?: string | null;
          name: string;
          url?: string | null;
          description?: string | null;
          icon?: string | null;
          platform: string;
          memberCount?: number | null;
          competencyUnits?: number | null;
          college?: string | null;
          degreeType?: string | null;
          serverId?: string | null;
          subredditName?: string | null;
          groupId?: string | null;
          degreeId?: string | null;
          studentGroupId?: string | null;
        }>;
        totalCount: number;
      };
    }>(allDataQuery);

    console.log(`📊 Retrieved ${allData.search.totalCount} total items`);

    // Separate data by type
    const courses: Record<string, any> = {};
    const degreePrograms: Array<any> = [];
    const discordServers: Array<any> = [];
    const redditCommunities: Array<any> = [];
    const wguConnectGroups: Array<any> = [];
    const wguStudentGroups: Array<any> = [];

    // Process each result
    allData.search.results.forEach((item) => {
      if (item.type === "course" && item.platform === "academic-registry" && item.courseCode) {
        // Extract course info
        courses[item.courseCode] = {
          courseCode: item.courseCode,
          name: item.name.replace(`${item.courseCode}: `, ""), // Remove code prefix from name
          description: item.description,
          competencyUnits: item.competencyUnits,
          type: "course",
        };
      } else if (item.type === "degree") {
        degreePrograms.push({
          id: item.degreeId,
          name: item.name,
          college: item.college,
          degreeType: item.degreeType,
          totalCUs: item.competencyUnits,
          description: item.description,
        });
      } else if (item.type === "community" || item.type === "university") {
        // Community data
        if (item.platform === "discord") {
          discordServers.push({
            id: item.serverId,
            name: item.name,
            description: item.description,
            inviteUrl: item.url,
            icon: item.icon,
            memberCount: item.memberCount,
          });
        } else if (item.platform === "reddit") {
          redditCommunities.push({
            name: item.subredditName || item.name,
            description: item.description,
            url: item.url,
            subscriberCount: item.memberCount,
          });
        } else if (item.platform === "wguConnect") {
          wguConnectGroups.push({
            id: item.groupId,
            name: item.name,
            description: item.description,
            url: item.url,
            memberCount: item.memberCount,
          });
        } else if (item.platform === "wgu-student-groups") {
          wguStudentGroups.push({
            id: item.studentGroupId,
            name: item.name,
            description: item.description,
            url: item.url,
            memberCount: item.memberCount,
            courseCode: item.courseCode,
            type: item.type,
          });
        }
      }
    });

    // Save all data files
    console.log("\n💾 Saving data to dev-cache...");

    // Courses
    await fs.writeFile(
      path.join(devCacheDir, "courses.json"),
      JSON.stringify(courses, null, 2)
    );
    console.log(`✅ Saved ${Object.keys(courses).length} courses`);

    // Degree Programs
    await fs.writeFile(
      path.join(devCacheDir, "degree-programs.json"),
      JSON.stringify(degreePrograms, null, 2)
    );
    console.log(`✅ Saved ${degreePrograms.length} degree programs`);

    // Discord Servers
    await fs.writeFile(
      path.join(devCacheDir, "discord-servers.json"),
      JSON.stringify(discordServers, null, 2)
    );
    console.log(`✅ Saved ${discordServers.length} Discord servers`);

    // Reddit Communities
    await fs.writeFile(
      path.join(devCacheDir, "reddit-communities.json"),
      JSON.stringify(redditCommunities, null, 2)
    );
    console.log(`✅ Saved ${redditCommunities.length} Reddit communities`);

    // WGU Connect Groups
    await fs.writeFile(
      path.join(devCacheDir, "wgu-connect-groups.json"),
      JSON.stringify(wguConnectGroups, null, 2)
    );
    console.log(`✅ Saved ${wguConnectGroups.length} WGU Connect groups`);

    // WGU Student Groups
    await fs.writeFile(
      path.join(devCacheDir, "wgu-student-groups.json"),
      JSON.stringify(wguStudentGroups, null, 2)
    );
    console.log(`✅ Saved ${wguStudentGroups.length} WGU Student groups`);

    // Create unified community data for backward compatibility
    const communities = {
      discord: discordServers,
      reddit: redditCommunities,
      wguConnect: wguConnectGroups,
      wguStudentGroups: wguStudentGroups,
    };

    await fs.writeFile(
      path.join(devCacheDir, "communities.json"),
      JSON.stringify(communities, null, 2)
    );

    // Create relationships file showing course-community mappings
    const courseRelationships: Record<string, any> = {};

    // Find all items that have a courseCode
    allData.search.results.forEach((item) => {
      if (item.courseCode) {
        if (!courseRelationships[item.courseCode]) {
          courseRelationships[item.courseCode] = {
            communities: [],
            resources: [],
          };
        }

        if (item.type === "community" || item.type === "university") {
          courseRelationships[item.courseCode].communities.push({
            platform: item.platform,
            name: item.name,
            url: item.url,
            memberCount: item.memberCount,
          });
        }
      }
    });

    await fs.writeFile(
      path.join(devCacheDir, "course-relationships.json"),
      JSON.stringify(courseRelationships, null, 2)
    );
    console.log(`✅ Saved course relationships for ${Object.keys(courseRelationships).length} courses`);

    // Create a manifest file with metadata
    const manifest = {
      generated: new Date().toISOString(),
      endpoint: GRAPHQL_ENDPOINT,
      counts: {
        total: allData.search.totalCount,
        courses: Object.keys(courses).length,
        degreePrograms: degreePrograms.length,
        discordServers: discordServers.length,
        redditCommunities: redditCommunities.length,
        wguConnectGroups: wguConnectGroups.length,
        wguStudentGroups: wguStudentGroups.length,
        coursesWithRelationships: Object.keys(courseRelationships).length,
      },
      files: [
        "courses.json",
        "degree-programs.json",
        "discord-servers.json",
        "reddit-communities.json",
        "wgu-connect-groups.json",
        "wgu-student-groups.json",
        "communities.json",
        "course-relationships.json",
        "manifest.json",
      ],
    };

    await fs.writeFile(
      path.join(devCacheDir, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );

    console.log("\n✅ Dev cache populated successfully!");
    console.log(`📁 Location: ${devCacheDir}`);
    console.log("\n📝 Files created:");
    manifest.files.forEach((file) => console.log(`   - ${file}`));

    console.log("\n📊 Data summary:");
    console.log(`   - Total items: ${allData.search.totalCount}`);
    console.log(`   - Courses: ${Object.keys(courses).length}`);
    console.log(`   - Degree Programs: ${degreePrograms.length}`);
    console.log(`   - Communities: ${discordServers.length + redditCommunities.length + wguConnectGroups.length + wguStudentGroups.length}`);
    console.log(`   - Courses with relationships: ${Object.keys(courseRelationships).length}`);
  } catch (error) {
    console.error("\n❌ Error populating dev cache:", error);
    console.error("\nTroubleshooting:");
    console.error("1. Check if the GraphQL endpoint is accessible");
    console.error("2. Verify the GraphQL queries match your schema");
    console.error("3. Set GRAPHQL_ENDPOINT environment variable if needed");
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateDevCache().catch(console.error);
}

export {populateDevCache};

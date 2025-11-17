import {defaultDb as db} from "../lib/firebase-admin-db";
import {searchCourses, searchCommunities} from "../lib/data-queries";

interface SearchResultItem {
  type: string;
  id: string;
  title: string;
  description?: string | null;
  url?: string | null;
  courseCode?: string | null;
  tags?: string[];
}

interface SearchArgs {
  query: string;
  limit?: number;
}


interface DegreeProgramLegacy {
  name?: string;
  code?: string;
  college?: string;
  degreeType?: string;
  totalCUs?: number;
}

export async function searchResolver(
  _parent: unknown,
  {query, limit = 20}: SearchArgs
) {
  const searchQuery = query.toLowerCase().trim();
  if (!searchQuery) {
    return {
      results: [],
      totalCount: 0,
    };
  }

  const results: SearchResultItem[] = [];

  // Use the data query functions when available
  try {
    // Search courses using the optimized query
    const courses = await searchCourses(query, Math.floor(limit / 3));
    courses.forEach((course) => {
      results.push({
        type: "course",
        id: course.courseCode,
        title: `${course.courseCode}: ${course.name}`,
        description: course.description,
        url: null,
        courseCode: course.courseCode,
        tags: [],
      });
    });

    // Search communities using the index
    const communities = await searchCommunities(query, {}, Math.floor(limit / 2));
    communities.forEach((community) => {
      results.push({
        type: "community",
        id: community.resourceId,
        title: community.title,
        description: community.description,
        url: community.url,
        courseCode: null,
        tags: [`platform:${community.type}`],
      });
    });
  } catch (error) {
    console.error("Error using optimized search:", error);
    // Fall back to direct collection searches below
  }

  // Search courses collection (individual documents)
  try {
    const coursesSnapshot = await db.collection("courses").get();
    coursesSnapshot.forEach((doc) => {
      const course = doc.data();
      if (
        doc.id.toLowerCase().includes(searchQuery) ||
        course.name?.toLowerCase().includes(searchQuery) ||
        course.description?.toLowerCase().includes(searchQuery) ||
        course.ccn?.toLowerCase().includes(searchQuery)
      ) {
        results.push({
          type: "course",
          id: doc.id,
          title: `${doc.id}: ${course.name}`,
          description: course.description,
          url: null,
          courseCode: doc.id,
          tags: ["platform:academic-registry"],
        });
      }
    });
  } catch (error) {
    console.error("Error searching courses:", error);
  }

  // Search academic-registry/degree-programs
  try {
    const programsDoc = await db.collection("academic-registry").doc("degree-programs").get();
    if (programsDoc.exists) {
      const data = programsDoc.data() || {};
      const programs = data.programs || {};

      for (const [, program] of Object.entries(programs)) {
        const p = program as DegreeProgramLegacy;
        if (
          p.name?.toLowerCase().includes(searchQuery) ||
          p.code?.toLowerCase().includes(searchQuery) ||
          p.college?.toLowerCase().includes(searchQuery)
        ) {
          results.push({
            type: "degree",
            id: p.code || `degree-${Math.random().toString(36).substr(2, 9)}`,
            title: p.name || "",
            description: `${p.college} - ${p.degreeType} - ${p.totalCUs || 0} CUs`,
            url: null,
            courseCode: null,
            tags: ["platform:academic-registry", "type:degree"],
          });
        }
      }
    }
  } catch (error) {
    console.error("Error searching degree programs:", error);
  }

  // Search Discord servers
  try {
    const discordSnapshot = await db.collection("discord-servers").get();
    discordSnapshot.forEach((doc) => {
      const server = doc.data();
      if (
        server.name?.toLowerCase().includes(searchQuery) ||
        server.description?.toLowerCase().includes(searchQuery)
      ) {
        results.push({
          type: "community",
          id: doc.id,
          title: server.name,
          description: server.description,
          url: server.inviteUrl || `https://discord.gg/${doc.id}`,
          courseCode: null,
          tags: ["platform:discord"],
        });
      }
    });
  } catch (error) {
    console.error("Error searching Discord servers:", error);
  }

  // Search WGU Connect groups
  try {
    const connectSnapshot = await db.collection("wgu-connect-groups").get();
    connectSnapshot.forEach((doc) => {
      const group = doc.data();
      if (
        group.name?.toLowerCase().includes(searchQuery) ||
        group.description?.toLowerCase().includes(searchQuery)
      ) {
        results.push({
          type: "community",
          id: doc.id,
          title: group.name,
          description: group.description,
          url: group.url,
          courseCode: null,
          tags: ["platform:wgu-connect"],
        });
      }
    });
  } catch (error) {
    console.error("Error searching WGU Connect groups:", error);
  }

  // Search Reddit communities
  try {
    const redditDoc = await db.collection("public").doc("reddit").get();
    if (redditDoc.exists) {
      const data = redditDoc.data() || {};
      const communities = data.communities || [];

      for (const community of communities) {
        if (
          community.name?.toLowerCase().includes(searchQuery) ||
          community.description?.toLowerCase().includes(searchQuery) ||
          community.college?.toLowerCase().includes(searchQuery)
        ) {
          results.push({
            type: "community",
            id: community.name,
            title: community.name,
            description: community.description,
            url: `https://reddit.com/r/${community.name}`,
            courseCode: null,
            tags: ["platform:reddit"],
          });
        }
      }
    }
  } catch (error) {
    console.error("Error searching Reddit communities:", error);
  }

  // Search WGU Student Groups
  try {
    const studentGroupsDoc = await db.collection("public").doc("wguStudentGroups").get();
    if (studentGroupsDoc.exists) {
      const data = studentGroupsDoc.data() || {};
      const groups = data.groups || [];

      for (const group of groups) {
        if (
          group.name?.toLowerCase().includes(searchQuery) ||
          group.description?.toLowerCase().includes(searchQuery) ||
          group.courseCode?.toLowerCase().includes(searchQuery)
        ) {
          results.push({
            type: "community",
            id: group.id || `group-${Math.random().toString(36).substr(2, 9)}`,
            title: group.name,
            description: group.description,
            url: group.url,
            courseCode: group.courseCode,
            tags: ["platform:student-groups"],
          });
        }
      }
    }
  } catch (error) {
    console.error("Error searching student groups:", error);
  }

  // Apply limit
  const limitedResults = results.slice(0, limit);

  return {
    results: limitedResults,
    totalCount: results.length,
  };
}

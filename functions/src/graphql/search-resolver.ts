import {db} from "../lib/firebase";

interface SearchResultItem {
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
}

interface SearchArgs {
  query: string;
  limit?: number;
}


interface DegreeProgram {
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
      query,
    };
  }

  const results: SearchResultItem[] = [];

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
          courseCode: doc.id, // Document ID is the course code
          name: `${doc.id}: ${course.name}`,
          url: null,
          description: course.description,
          icon: null,
          platform: "academic-registry",
          memberCount: null,
          competencyUnits: course.competencyUnits,
          college: null,
          degreeType: null,
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
        const p = program as DegreeProgram;
        if (
          p.name?.toLowerCase().includes(searchQuery) ||
          p.code?.toLowerCase().includes(searchQuery) ||
          p.college?.toLowerCase().includes(searchQuery)
        ) {
          results.push({
            type: "degree",
            courseCode: null,
            name: p.name || "",
            url: null,
            description: `${p.college} - ${p.degreeType} - ${p.totalCUs || 0} CUs`,
            icon: null,
            platform: "academic-registry",
            memberCount: null,
            competencyUnits: p.totalCUs,
            college: p.college,
            degreeType: p.degreeType,
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
          courseCode: null,
          name: server.name,
          url: server.inviteUrl || `https://discord.gg/${doc.id}`,
          description: server.description,
          icon: server.icon,
          platform: "discord",
          memberCount: server.memberCount,
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
          courseCode: null,
          name: group.name,
          url: `https://connect.wgu.edu/groups/${doc.id}`,
          description: group.description,
          icon: null,
          platform: "wguConnect",
          memberCount: group.memberCount,
        });
      }
    });
  } catch (error) {
    console.error("Error searching WGU Connect groups:", error);
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
            type: group.courseCode ? "course" : "university",
            courseCode: group.courseCode,
            name: group.name,
            url: group.url,
            description: group.description,
            icon: null,
            platform: "wgu-student-groups",
            memberCount: group.memberCount,
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
    query,
  };
}

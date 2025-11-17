import {
  getCourseWithCommunities,
  searchCourses,
  getCoursesByIds,
  getPopularCourses,
} from "../lib/data-queries.js";
import {Course} from "../lib/data-model.js";

interface CoursesArgs {
  search?: string;
  discordId?: string;
  redditId?: string;
  codes?: string[];
}

interface CourseResult {
  code: string;
  name: string;
  competencyUnits: number;
  description?: string;
}

export async function coursesResolver(
  _parent: unknown,
  args: CoursesArgs
): Promise<{ items: CourseResult[]; totalCount: number }> {
  const {search, discordId, redditId, codes} = args;
  let courses: Course[] = [];

  try {
    if (search) {
      // Use the optimized search query
      courses = await searchCourses(search, 50);
    } else if (codes && codes.length > 0) {
      // Batch fetch specific courses
      courses = await getCoursesByIds(codes);
    } else if (discordId || redditId) {
      // TODO: Implement filtering by community IDs
      // This would require a reverse lookup from community to courses
      // For now, return empty
      courses = [];
    } else {
      // No filters - return popular courses
      const popularCourses = await getPopularCourses({limit: 20});
      courses = popularCourses;
    }

    // Transform to GraphQL format
    const items = courses.map((course) => ({
      code: course.courseCode,
      name: course.name,
      competencyUnits: course.units,
      description: course.description,
    }));

    return {
      items,
      totalCount: items.length,
    };
  } catch (error) {
    console.error("Error in coursesResolver:", error);
    return {
      items: [],
      totalCount: 0,
    };
  }
}

// Resolver for course associations
export async function courseDiscordResolver(parent: CourseResult) {
  try {
    const courseView = await getCourseWithCommunities(parent.code);
    return courseView?.communities.discord.map((d) => d.server) || [];
  } catch (error) {
    console.error(`Error fetching Discord servers for course ${parent.code}:`, error);
    return [];
  }
}

export async function courseRedditResolver(parent: CourseResult) {
  try {
    const courseView = await getCourseWithCommunities(parent.code);
    return courseView?.communities.reddit.map((r) => r.community) || [];
  } catch (error) {
    console.error(`Error fetching Reddit communities for course ${parent.code}:`, error);
    return [];
  }
}

export async function courseWguConnectResolver(parent: CourseResult) {
  try {
    const courseView = await getCourseWithCommunities(parent.code);
    return courseView?.communities.wguConnect || null;
  } catch (error) {
    console.error(`Error fetching WGU Connect for course ${parent.code}:`, error);
    return null;
  }
}

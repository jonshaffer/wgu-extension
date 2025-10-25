import {searchResolver} from "./search-resolver.js";
import {searchSubredditsResolver} from "./reddit-search-resolver.js";
import {
  coursesResolver,
  courseDiscordResolver,
  courseRedditResolver,
  courseWguConnectResolver,
} from "./courses-resolver.js";
import {degreeProgramsResolver, degreeProgramCoursesResolver} from "./degree-programs-resolver.js";
import {discordServersResolver} from "./discord-resolver.js";
import {
  submitCourseSuggestion,
  submitDiscordSuggestion,
  submitRedditSuggestion,
  submitCommunityMapping,
} from "./suggestion-resolvers.js";

export const publicResolvers = {
  Query: {
    ping: () => "pong",
    search: searchResolver,
    searchSubreddits: searchSubredditsResolver,
    courses: coursesResolver,
    course: async (_parent: unknown, args: { code: string }) => {
      const {getCoursesByIds} = await import("../lib/data-queries.js");
      const courses = await getCoursesByIds([args.code]);
      if (courses.length === 0) return null;
      const course = courses[0];
      return {
        code: course.courseCode,
        name: course.name,
        competencyUnits: course.units,
        description: course.description,
        level: course.level,
      };
    },
    degreePlans: degreeProgramsResolver,
    degreeProgram: async (_parent: unknown, args: { id: string }) => {
      const {getDegreeProgramWithCourses} = await import("../lib/data-queries.js");
      const result = await getDegreeProgramWithCourses(args.id);
      if (!result) return null;
      return {
        id: result.program.id,
        code: result.program.code,
        name: result.program.name,
        college: result.program.college,
        level: result.program.level,
        totalUnits: result.program.totalUnits,
      };
    },
    discordServers: discordServersResolver,
    redditCommunities: async (_parent: unknown, args: any) => {
      const {searchCommunities, getTrendingCommunities} = await import("../lib/data-queries.js");
      const {search, courseCode, limit = 20} = args;

      if (search || courseCode) {
        const results = await searchCommunities(search || "", {
          type: "reddit",
          courseCodes: courseCode ? [courseCode] : undefined,
        }, limit);

        const {db} = await import("../lib/firebase.js");
        const communityPromises = results.map((r: any) =>
          db.collection("reddit-communities").doc(r.resourceId).get()
        );
        const docs = await Promise.all(communityPromises);

        return docs
          .filter((doc) => doc.exists)
          .map((doc) => doc.data());
      }

      const trending = await getTrendingCommunities(limit);
      return trending.reddit;
    },
    wguConnect: async (_parent: unknown, args: { courseCode: string }) => {
      const {getCourseWithCommunities} = await import("../lib/data-queries.js");
      const courseView = await getCourseWithCommunities(args.courseCode);
      return courseView?.communities.wguConnect || null;
    },
    getCommunitiesForCourse: async (_parent: unknown, args: { courseCode: string }) => {
      const {getCourseWithCommunities, getCoursesByIds} = await import("../lib/data-queries.js");
      const {db} = await import("../lib/firebase.js");
      const {COLLECTIONS} = await import("../lib/data-model.js");

      // Get course details
      const courses = await getCoursesByIds([args.courseCode]);
      const course = courses[0];
      if (!course) {
        return {
          courseCode: args.courseCode,
          courseName: null,
          discord: [],
          reddit: [],
          wguConnect: null,
          studentGroups: [],
        };
      }

      // Get communities
      const courseView = await getCourseWithCommunities(args.courseCode);

      // Get student groups (not currently in getCourseWithCommunities)
      const studentGroupsSnapshot = await db
        .collection(COLLECTIONS.WGU_STUDENT_GROUPS)
        .where("active", "==", true)
        .limit(10)
        .get();
      const studentGroups = studentGroupsSnapshot.docs.map((doc) => doc.data());

      return {
        courseCode: args.courseCode,
        courseName: course.name,
        discord: courseView?.communities.discord.map((d) => d.server) || [],
        reddit: courseView?.communities.reddit.map((r) => r.community) || [],
        wguConnect: courseView?.communities.wguConnect || null,
        studentGroups: studentGroups,
      };
    },
  },
  Course: {
    discord: courseDiscordResolver,
    reddit: courseRedditResolver,
    wguConnect: courseWguConnectResolver,
  },
  DegreeProgram: {
    courses: degreeProgramCoursesResolver,
  },
  Mutation: {
    submitCourseSuggestion,
    submitDiscordSuggestion,
    submitRedditSuggestion,
    submitCommunityMapping,
  },
};

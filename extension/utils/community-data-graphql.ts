/**
 * Community data fetching using GraphQL API
 * This will replace the old community-data.ts that fetches from static files
 */

import { 
  getCourses, 
  searchCommunities, 
  getCommunitiesForCourse,
  getCommunitiesForCourseV2,
  withCache,
  createClient,
  type Course,
  type Community,
  type CourseCommunitiesResponse
} from '@wgu-extension/graphql-client';

// Create cached versions of the API functions (1 hour cache)
const cachedGetCourses = withCache(getCourses, 60 * 60 * 1000);
const cachedSearchCommunities = withCache(searchCommunities, 60 * 60 * 1000);
const cachedGetCommunitiesForCourse = withCache(getCommunitiesForCourse, 60 * 60 * 1000);
const cachedGetCommunitiesForCourseV2 = withCache(getCommunitiesForCourseV2, 60 * 60 * 1000);

// Create a client with custom endpoint if needed (for development)
const client = createClient({
  endpoint: import.meta.env.VITE_GRAPHQL_ENDPOINT || undefined
});

/**
 * Load all community data (courses and communities)
 * This maintains compatibility with the old loadCommunityData function
 */
export async function loadCommunityData() {
  try {
    const debugMode = import.meta.env.WXT_DEBUG_MODE === 'true';
    
    if (debugMode) {
      console.log('Community Data GraphQL Fetch:');
      console.log('- Endpoint:', import.meta.env.VITE_GRAPHQL_ENDPOINT || 'default');
    }

    // Fetch courses and communities in parallel
    const [courses, communities] = await Promise.all([
      cachedGetCourses(client),
      cachedSearchCommunities('', 1000, client)
    ]);

    // Transform to match the old format for compatibility
    const coursesMap = courses.reduce((acc: Record<string, Course>, course: Course) => {
      acc[course.code || course.courseCode || ''] = course;
      return acc;
    }, {} as Record<string, Course>);

    // Group communities by type
    const communitiesByType = communities.reduce((acc: Record<string, Community[]>, community: Community) => {
      const type = community.type.toLowerCase();
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(community);
      return acc;
    }, {} as Record<string, Community[]>);

    // Build unified data structure to match old format
    const unifiedData = {
      courses: coursesMap,
      discordServers: communitiesByType['discord'] || [],
      communities: communitiesByType,
      reddit: communitiesByType['reddit'] || [],
      wguConnect: communitiesByType['wgu-connect'] || [],
      // Add course mappings that the old system used
      courseMappings: [] // This will be populated by individual course queries
    };

    return { unifiedData };
    
  } catch (error) {
    console.warn('Failed to load community data from GraphQL:', error);
    
    // Return empty structure matching the expected format
    return { 
      unifiedData: { 
        courses: {},
        discordServers: [], 
        communities: {}, 
        reddit: {}, 
        wguConnect: {},
        courseMappings: [] 
      } 
    };
  }
}

/**
 * Get communities for a specific course (legacy - search based)
 */
export async function getCommunitiesForCourseCode(courseCode: string): Promise<Community[]> {
  try {
    return await cachedGetCommunitiesForCourse(courseCode, client);
  } catch (error) {
    console.warn(`Failed to load communities for course ${courseCode}:`, error);
    return [];
  }
}

/**
 * Get all community data for a specific course (V2 - structured response)
 */
export async function getCourseCommunitiesV2(courseCode: string): Promise<CourseCommunitiesResponse | null> {
  try {
    return await cachedGetCommunitiesForCourseV2(courseCode, client);
  } catch (error) {
    console.warn(`Failed to load community data for course ${courseCode}:`, error);
    return null;
  }
}

/**
 * Get course information by code
 */
export async function getCourseByCode(courseCode: string): Promise<Course | null> {
  try {
    const courses = await cachedGetCourses(client);
    return courses.find((c: Course) => (c.code || c.courseCode) === courseCode) || null;
  } catch (error) {
    console.warn(`Failed to load course ${courseCode}:`, error);
    return null;
  }
}

/**
 * Load course-specific community data in the format expected by UI components
 */
export async function loadCourseCommunitiesForUI(courseCode: string) {
  try {
    const communityData = await getCourseCommunitiesV2(courseCode);
    if (!communityData) {
      return { discord: [], reddit: [], wguConnect: [], wguStudentGroups: [] };
    }

    // Transform to UI format
    return {
      discord: communityData.discord.map(server => ({
        type: 'discord' as const,
        name: server.name,
        url: server.inviteUrl,
        description: server.description || `Discord server with ${server.memberCount || 0} members`
      })),
      reddit: communityData.reddit.map(community => ({
        type: 'reddit' as const,
        name: community.name,
        url: community.url,
        description: community.description || `Subreddit with ${community.subscriberCount || 0} subscribers`
      })),
      wguConnect: communityData.wguConnect ? [{
        type: 'wgu-connect' as const,
        name: communityData.wguConnect.name,
        url: `https://wguconnect.wgu.edu/groups/${communityData.wguConnect.id}`,
        description: communityData.wguConnect.description || 'Official WGU Connect group'
      }] : [],
      wguStudentGroups: communityData.studentGroups.map(group => ({
        type: 'wgu-student-groups' as const,
        name: group.name,
        url: group.websiteUrl || '#',
        description: group.description || `${group.type} student group`
      }))
    };
  } catch (error) {
    console.error(`Error loading communities for course ${courseCode}:`, error);
    return { discord: [], reddit: [], wguConnect: [], wguStudentGroups: [] };
  }
}
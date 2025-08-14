/**
 * Community data fetching using GraphQL API
 * This will replace the old community-data.ts that fetches from static files
 */

import { 
  getCourses, 
  searchCommunities, 
  getCommunitiesForCourse,
  withCache,
  createClient,
  type Course,
  type Community
} from '@wgu-extension/graphql-client';

// Create cached versions of the API functions (1 hour cache)
const cachedGetCourses = withCache(getCourses, 60 * 60 * 1000);
const cachedSearchCommunities = withCache(searchCommunities, 60 * 60 * 1000);
const cachedGetCommunitiesForCourse = withCache(getCommunitiesForCourse, 60 * 60 * 1000);

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
      console.log('- Endpoint:', client.requestConfig.endpoint);
    }

    // Fetch courses and communities in parallel
    const [courses, communities] = await Promise.all([
      cachedGetCourses(client),
      cachedSearchCommunities('', 1000, client)
    ]);

    // Transform to match the old format for compatibility
    const coursesMap = courses.reduce((acc, course) => {
      acc[course.courseCode] = course;
      return acc;
    }, {} as Record<string, Course>);

    // Group communities by type
    const communitiesByType = communities.reduce((acc, community) => {
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
      wguConnect: communitiesByType['wgu-connect'] || []
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
        wguConnect: {} 
      } 
    };
  }
}

/**
 * Get communities for a specific course
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
 * Get course information by code
 */
export async function getCourseByCode(courseCode: string): Promise<Course | null> {
  try {
    const courses = await cachedGetCourses(client);
    return courses.find(c => c.courseCode === courseCode) || null;
  } catch (error) {
    console.warn(`Failed to load course ${courseCode}:`, error);
    return null;
  }
}
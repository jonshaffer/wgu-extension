/**
 * GraphQL queries exported from the allowlist
 * These are the only queries allowed on the public endpoint
 */
import allowlist from "./allowlist.json";

// Export individual queries for type safety and ease of use
export const PING_QUERY = allowlist.ping_query;
export const SEARCH_BASIC = allowlist.search_basic;
export const SEARCH_FULL = allowlist.search_full;
export const SEARCH_SUBREDDITS = allowlist.search_subreddits;
export const ADVANCED_SEARCH = allowlist.advanced_search;
export const GET_COURSES = allowlist.get_courses;
export const GET_COURSES_FULL = allowlist.get_courses_full;
export const GET_COURSE = allowlist.get_course;
export const GET_COURSE_BY_CODE = allowlist.get_course_by_code;
export const GET_COURSE_SIMPLE = allowlist.get_course_simple;
export const GET_DISCORD_SERVERS = allowlist.get_discord_servers;
export const GET_DISCORD_SERVERS_FULL = allowlist.get_discord_servers_full;
export const GET_DISCORD_SERVER = allowlist.get_discord_server;
export const GET_DISCORD_SERVER_FULL = allowlist.get_discord_server_full;
export const GET_REDDIT_COMMUNITIES = allowlist.get_reddit_communities;
export const GET_REDDIT_COMMUNITIES_FULL = allowlist.get_reddit_communities_full;
export const GET_REDDIT_COMMUNITY = allowlist.get_reddit_community;
export const GET_REDDIT_COMMUNITY_FULL = allowlist.get_reddit_community_full;
export const GET_WGU_CONNECT_GROUPS = allowlist.get_wgu_connect_groups;
export const GET_WGU_CONNECT_GROUPS_FULL = allowlist.get_wgu_connect_groups_full;
export const GET_WGU_CONNECT_GROUP = allowlist.get_wgu_connect_group;
export const GET_WGU_CONNECT_GROUP_FULL = allowlist.get_wgu_connect_group_full;
export const GET_DEGREE_PLANS = allowlist.get_degree_plans;
export const GET_DEGREE_PLANS_FULL = allowlist.get_degree_plans_full;
export const GET_DEGREE_PLAN = allowlist.get_degree_plan;
export const GET_DEGREE_PLAN_SIMPLE = allowlist.get_degree_plan_simple;
export const GET_STUDENT_GROUPS = allowlist.get_student_groups;
export const GET_STUDENT_GROUPS_FULL = allowlist.get_student_groups_full;
export const GET_STUDENT_GROUP = allowlist.get_student_group;
export const GET_STUDENT_GROUP_FULL = allowlist.get_student_group_full;
export const GET_COMMUNITIES = allowlist.get_communities;
export const GET_COMMUNITIES_FOR_COURSE = allowlist.get_communities_for_course;
export const GET_COMMUNITIES_FOR_COURSE_V2 = allowlist.get_communities_for_course_v2;

// Export the full allowlist for advanced use cases
export {allowlist};

// Helper to get query by key
export function getQuery(key: keyof typeof allowlist): string {
  return allowlist[key];
}

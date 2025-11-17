import { gql } from 'graphql-request';
// Import directly from the allowlist JSON to avoid ESM/CJS interop issues
// This file is the source of truth for all allowed queries
import allowlist from '../../functions/src/graphql/allowlist.json';

/**
 * GraphQL queries wrapped with gql tag for use with graphql-request
 * Query strings are imported directly from the allowlist to ensure consistency
 */

export const GET_COURSES = gql`${allowlist.get_courses}`;

export const GET_COMMUNITIES_QUERY = gql`${allowlist.get_communities}`;

export const GET_COMMUNITIES_FOR_COURSE_QUERY = gql`${allowlist.get_communities_for_course}`;

export const GET_DEGREE_PLANS = gql`${allowlist.get_degree_plans}`;

export const GET_COURSE_BY_CODE = gql`${allowlist.get_course_by_code}`;

export const GET_COMMUNITIES_FOR_COURSE_QUERY_V2 = gql`${allowlist.get_communities_for_course_v2}`;
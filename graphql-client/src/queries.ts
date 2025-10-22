import { gql } from 'graphql-request';
import { 
  GET_COURSES as GET_COURSES_QUERY,
  GET_COMMUNITIES,
  GET_COMMUNITIES_FOR_COURSE,
  GET_COMMUNITIES_FOR_COURSE_V2,
  GET_DEGREE_PLANS as GET_DEGREE_PLANS_QUERY,
  GET_COURSE_BY_CODE as GET_COURSE_BY_CODE_QUERY
} from '@wgu-extension/functions/graphql';

/**
 * GraphQL queries wrapped with gql tag for use with graphql-request
 */

export const GET_COURSES = gql`${GET_COURSES_QUERY}`;

export const GET_COMMUNITIES_QUERY = gql`${GET_COMMUNITIES}`;

export const GET_COMMUNITIES_FOR_COURSE_QUERY = gql`${GET_COMMUNITIES_FOR_COURSE}`;

export const GET_DEGREE_PLANS = gql`${GET_DEGREE_PLANS_QUERY}`;

export const GET_COURSE_BY_CODE = gql`${GET_COURSE_BY_CODE_QUERY}`;

export const GET_COMMUNITIES_FOR_COURSE_QUERY_V2 = gql`${GET_COMMUNITIES_FOR_COURSE_V2}`;
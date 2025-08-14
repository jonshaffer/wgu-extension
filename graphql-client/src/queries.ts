import { gql } from 'graphql-request';
import { queries } from '@wgu-extension/functions/graphql';

/**
 * GraphQL queries wrapped with gql tag for use with graphql-request
 */

export const GET_COURSES = gql`${queries.GET_COURSES}`;

export const GET_COMMUNITIES = gql`${queries.GET_COMMUNITIES}`;

export const GET_COMMUNITIES_FOR_COURSE = gql`${queries.GET_COMMUNITIES_FOR_COURSE}`;

export const GET_DEGREE_PLANS = gql`${queries.GET_DEGREE_PLANS}`;

// Additional query not in the functions package
export const GET_COURSE_BY_CODE = gql`
  query GetCourseByCode($courseCode: String!) {
    search(query: $courseCode, limit: 1) {
      results {
        type
        id
        title
        description
        courseCode
      }
    }
  }
`;
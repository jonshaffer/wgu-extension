import { gql } from '@apollo/client/index.js';

export const SEARCH = gql`
  query Search($query: String!, $limit: Int) {
    search(query: $query, limit: $limit) {
      results {
        type
        courseCode
        name
        url
        description
        icon
        platform
        memberCount
      }
      totalCount
      query
    }
  }
`;
export const typeDefs = `#graphql
  type Query {
    ping: String!
    search(query: String!, limit: Int = 20): SearchResponse!
    courses(limit: Int = 50, offset: Int = 0): CourseList!
    degreePlans(limit: Int = 50, offset: Int = 0): DegreePlanList!
  }

  type SearchResponse {
    results: [SearchResult!]!
    totalCount: Int!
  }

  type SearchResult {
    type: String!
    id: String!
    title: String!
    description: String
    url: String
    courseCode: String
    tags: [String!]
  }

  type CourseList {
    items: [Course!]!
    totalCount: Int!
  }

  type Course {
    courseCode: String!
    name: String!
    description: String
    units: Int
    level: String
  }

  type DegreePlanList {
    items: [DegreePlan!]!
    totalCount: Int!
  }

  type DegreePlan {
    id: String!
    name: String!
    description: String
    totalCUs: Int
    courses: [String!]
  }
`;

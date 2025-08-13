export const typeDefs = /* GraphQL */ `

  type Course {
    courseCode: String!
    courseName: String!
    description: String
    competencyUnits: Int
    prerequisites: [String!]
    level: String
    courseType: String
  }

  type DegreePlan {
    degreeId: String!
    degreeName: String!
    college: String!
    degreeType: String!
    totalCUs: Int
    courses: [String!]!
  }

  type SearchResult {
    type: String!
    courseCode: String
    name: String!
    url: String
    description: String
    icon: String
    platform: String
    memberCount: Int
    competencyUnits: Int
    college: String
    degreeType: String
  }

  type SearchResults {
    results: [SearchResult!]!
    totalCount: Int!
    query: String!
  }

  type Query {
    ping: String!
    search(query: String!, limit: Int = 20): SearchResults!
  }
`;

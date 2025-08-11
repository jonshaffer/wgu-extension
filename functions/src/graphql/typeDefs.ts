export const typeDefs = /* GraphQL */ `
  type CommunityLink {
    type: String
    name: String!
    url: String!
    icon: String
    description: String
  }

  type CourseMapping {
    courseCode: String!
    discord: [CommunityLink!]
    reddit: [CommunityLink!]
    wguConnect: [CommunityLink!]
    wguStudentGroups: [CommunityLink!]
  }

  type UniversityLevel {
    discord: [CommunityLink!]
    reddit: [CommunityLink!]
    wguConnect: [CommunityLink!]
    wguStudentGroups: [CommunityLink!]
  }

  type UnifiedCommunityData {
    discordServers: [String!]
    courseMappings: [CourseMapping!]
    universityLevel: UniversityLevel
    updatedAt: String
    etag: String
  }

  type Query {
    ping: String!
    unifiedCommunityData: UnifiedCommunityData
  }
`;

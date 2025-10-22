export const adminTypeDefs = `#graphql
  type Query {
    ping: String!
    # Read operations (same as public + additional admin data)
    search(query: String!, limit: Int = 20): SearchResponse!
    searchSubreddits(
      query: String!, 
      subreddits: [String!]!, 
      sortBy: RedditSortBy = NEW,
      timeWindow: RedditTimeWindow = WEEK,
      limit: Int = 50
    ): RedditSearchResponse!
    courses(limit: Int = 50, offset: Int = 0): CourseList!
    degreePlans(limit: Int = 50, offset: Int = 0): DegreePlanList!
    
    # Admin-only read operations
    discordServers(limit: Int = 50, offset: Int = 0): DiscordServerList!
    redditCommunities(limit: Int = 50, offset: Int = 0): RedditCommunityList!
    ingestionStats: IngestionStats!
  }

  type Mutation {
    # Discord mutations
    ingestDiscordServer(input: DiscordServerInput!): DiscordServer!
    updateDiscordServer(id: String!, input: DiscordServerUpdateInput!): DiscordServer!
    deleteDiscordServer(id: String!): Boolean!

    # Reddit mutations  
    ingestRedditCommunity(input: RedditCommunityInput!): RedditCommunity!
    updateRedditCommunity(id: String!, input: RedditCommunityUpdateInput!): RedditCommunity!
    deleteRedditCommunity(id: String!): Boolean!
    
    # Course mutations
    upsertCourse(input: CourseInput!): Course!
    deleteCourse(courseCode: String!): Boolean!
    
    # Degree plan mutations
    upsertDegreePlan(input: DegreePlanInput!): DegreePlan!
    deleteDegreePlan(id: String!): Boolean!
  }

  enum RedditSortBy {
    NEW
    HOT
    TOP
    RELEVANCE
    COMMENTS
  }

  enum RedditTimeWindow {
    HOUR
    DAY
    WEEK
    MONTH
    YEAR
    ALL
  }

  # Input types
  input DiscordServerInput {
    serverId: String!
    name: String!
    description: String
    memberCount: Int
    inviteUrl: String
    tags: [String!]
  }

  input DiscordServerUpdateInput {
    name: String
    description: String
    memberCount: Int
    inviteUrl: String
    tags: [String!]
  }

  input RedditCommunityInput {
    subreddit: String!
    name: String!
    description: String
    memberCount: Int
    url: String
    tags: [String!]
  }

  input RedditCommunityUpdateInput {
    name: String
    description: String
    memberCount: Int
    url: String
    tags: [String!]
  }

  input CourseInput {
    courseCode: String!
    name: String!
    description: String
    units: Int
    level: String
  }

  input DegreePlanInput {
    id: String!
    name: String!
    description: String
    totalCUs: Int
    courses: [String!]
  }

  # Response types
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

  type RedditSearchResponse {
    results: [RedditPost!]!
    totalCount: Int!
    searchQuery: String!
    subreddits: [String!]!
    sortBy: RedditSortBy!
    timeWindow: RedditTimeWindow!
  }

  type RedditPost {
    id: String!
    title: String!
    text: String
    url: String!
    author: String!
    subreddit: String!
    score: Int!
    upvoteRatio: Float
    numComments: Int!
    created: String!
    permalink: String!
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

  type DiscordServerList {
    items: [DiscordServer!]!
    totalCount: Int!
  }

  type DiscordServer {
    id: String!
    serverId: String!
    name: String!
    description: String
    memberCount: Int
    inviteUrl: String
    tags: [String!]
    createdAt: String!
    updatedAt: String!
  }

  type RedditCommunityList {
    items: [RedditCommunity!]!
    totalCount: Int!
  }

  type RedditCommunity {
    id: String!
    subreddit: String!
    name: String!
    description: String
    memberCount: Int
    url: String
    tags: [String!]
    createdAt: String!
    updatedAt: String!
  }

  type IngestionStats {
    discordServers: Int!
    redditCommunities: Int!
    courses: Int!
    degreePlans: Int!
    lastUpdated: String!
  }
`;

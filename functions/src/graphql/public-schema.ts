export const publicTypeDefs = `#graphql
  type Query {
    ping: String!
    search(query: String!, limit: Int = 20): SearchResponse!
    searchSubreddits(
      query: String!, 
      subreddits: [String!]!, 
      sortBy: RedditSortBy = NEW,
      timeWindow: RedditTimeWindow = WEEK,
      limit: Int = 50
    ): RedditSearchResponse!
    courses(
      search: String
      discordId: String
      redditId: String
      codes: [String!]
      limit: Int = 50
      offset: Int = 0
    ): CourseList!
    course(code: String!): Course
    degreePlans(
      college: String
      level: String
      limit: Int = 50
      offset: Int = 0
    ): DegreePlanList!
    degreeProgram(id: String!): DegreeProgram
    discordServers(
      search: String
      courseCode: String
      limit: Int = 20
    ): [DiscordServer!]!
    redditCommunities(
      search: String
      courseCode: String
      type: String
      limit: Int = 20
    ): [RedditCommunity!]!
    wguConnect(courseCode: String!): WguConnectGroup
    getCommunitiesForCourse(courseCode: String!): CourseCommunitiesResponse!
  }
  
  type Mutation {
    submitCourseSuggestion(input: CourseSuggestionInput!): SuggestionResponse!
    submitDiscordSuggestion(input: DiscordSuggestionInput!): SuggestionResponse!
    submitRedditSuggestion(input: RedditSuggestionInput!): SuggestionResponse!
    submitCommunityMapping(input: CommunityMappingInput!): SuggestionResponse!
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
  
  type DiscordServer {
    id: String!
    name: String!
    description: String
    inviteUrl: String!
    memberCount: Int
    channels: [DiscordChannel!]
    tags: [String!]!
    verified: Boolean!
  }
  
  type DiscordChannel {
    id: String!
    name: String!
    type: String!
    associatedCourses: [String!]
  }
  
  type RedditCommunity {
    id: String!
    name: String!
    description: String
    url: String!
    subscriberCount: Int
    type: String!
    associatedPrograms: [String!]
    associatedCourses: [String!]
    tags: [String!]!
    active: Boolean!
  }
  
  type WguConnectGroup {
    id: String!
    courseCode: String!
    name: String!
    description: String
    resources: [WguConnectResource!]!
    memberCount: Int
  }
  
  type WguConnectResource {
    id: String!
    title: String!
    type: String!
    url: String!
    upvotes: Int
  }
  
  type StudentGroup {
    id: String!
    name: String!
    description: String
    type: String!
    contactEmail: String
    websiteUrl: String
    tags: [String!]!
    active: Boolean!
  }
  
  type CourseCommunitiesResponse {
    courseCode: String!
    courseName: String
    discord: [DiscordServer!]!
    reddit: [RedditCommunity!]!
    wguConnect: WguConnectGroup
    studentGroups: [StudentGroup!]!
  }
  
  # Suggestion Types
  
  input CourseSuggestionInput {
    operation: SuggestionOperation!
    targetCourseCode: String
    courseCode: String!
    name: String!
    description: String
    units: Int!
    level: CourseLevel!
    type: CourseType!
    prerequisites: [String!]
    rationale: String!
  }
  
  input DiscordSuggestionInput {
    operation: SuggestionOperation!
    targetServerId: String
    name: String!
    description: String
    inviteUrl: String!
    channels: [DiscordChannelInput!]
    tags: [String!]!
    rationale: String!
    evidence: DiscordEvidenceInput
  }
  
  input DiscordChannelInput {
    name: String!
    type: String!
    associatedCourses: [String!]
  }
  
  input DiscordEvidenceInput {
    memberCount: Int
    screenshotUrls: [String!]
    verificationNotes: String
  }
  
  input RedditSuggestionInput {
    operation: SuggestionOperation!
    targetSubreddit: String
    subredditName: String!
    displayName: String!
    description: String
    type: RedditCommunityType!
    associatedPrograms: [String!]
    associatedCourses: [String!]
    tags: [String!]!
    rationale: String!
  }
  
  input CommunityMappingInput {
    courseCode: String!
    communityType: CommunityType!
    communityId: String!
    communityName: String!
    action: MappingAction!
    relevance: CommunityRelevance!
    confidence: Float!
    rationale: String!
  }
  
  enum SuggestionOperation {
    ADD
    UPDATE
    DELETE
  }
  
  enum CourseLevel {
    UNDERGRADUATE
    GRADUATE
  }
  
  enum CourseType {
    GENERAL
    MAJOR
    ELECTIVE
  }
  
  enum RedditCommunityType {
    MAIN
    PROGRAM_SPECIFIC
    COURSE_SPECIFIC
  }
  
  enum CommunityType {
    DISCORD
    REDDIT
    WGU_CONNECT
  }
  
  enum MappingAction {
    ADD
    REMOVE
    UPDATE
  }
  
  enum CommunityRelevance {
    DIRECT
    PROGRAM
    GENERAL
  }
  
  type SuggestionResponse {
    success: Boolean!
    suggestionId: String
    message: String!
    validationErrors: [ValidationError!]
  }
  
  type ValidationError {
    field: String!
    message: String!
    severity: ValidationSeverity!
  }
  
  enum ValidationSeverity {
    ERROR
    WARNING
  }

  type CourseList {
    items: [Course!]!
    totalCount: Int!
  }

  type Course {
    code: String!
    name: String!
    description: String
    competencyUnits: Int
    level: String
    discord: [DiscordServer!]
    reddit: [RedditCommunity!]
    wguConnect: WguConnectGroup
  }

  type DegreePlanList {
    items: [DegreePlan!]!
    totalCount: Int!
  }

  type DegreeProgram {
    id: String!
    code: String!
    name: String!
    college: String!
    level: String!
    totalUnits: Int!
    courses: [Course!]!
  }
  
  type DegreePlan {
    id: String!
    name: String!
    description: String
    totalCUs: Int
    courses: [String!]
  }
`;

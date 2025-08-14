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
        competencyUnits
        college
        degreeType
        serverId
        subredditName
        groupId
        degreeId
        studentGroupId
      }
      totalCount
      query
    }
  }
`;

export const ADVANCED_SEARCH = gql`
  query AdvancedSearch(
    $query: String!
    $filters: [SearchFilter!]
    $textSearch: String
    $limit: Int
    $offset: Int
  ) {
    advancedSearch(
      query: $query
      filters: $filters
      textSearch: $textSearch
      limit: $limit
      offset: $offset
    ) {
      results {
        type
        courseCode
        name
        url
        description
        icon
        platform
        memberCount
        competencyUnits
        college
        degreeType
        level
        units
        serverId
        subredditName
        groupId
        degreeId
        studentGroupId
        tags
      }
      totalCount
      query
      appliedFilters
    }
  }
`;

export const GET_COURSES = gql`
  query GetCourses($limit: Int, $offset: Int) {
    courses(limit: $limit, offset: $offset) {
      items {
        courseCode
        name
        units
        level
        competencyUnits
      }
      totalCount
    }
  }
`;

export const GET_COURSE = gql`
  query GetCourse($courseCode: String!) {
    course(courseCode: $courseCode) {
      courseCode
      name
      description
      units
      level
      competencyUnits
      prerequisites
      corequisites
    }
  }
`;

export const GET_DISCORD_SERVERS = gql`
  query GetDiscordServers($limit: Int, $offset: Int) {
    discordServers(limit: $limit, offset: $offset) {
      items {
        id
        name
        icon
        memberCount
        description
        categories
      }
      totalCount
    }
  }
`;

export const GET_DISCORD_SERVER = gql`
  query GetDiscordServer($serverId: String!) {
    discordServer(serverId: $serverId) {
      id
      name
      icon
      memberCount
      description
      categories
      channels {
        id
        name
        type
        category
      }
      inviteUrl
    }
  }
`;

export const GET_REDDIT_COMMUNITIES = gql`
  query GetRedditCommunities($limit: Int, $offset: Int) {
    redditCommunities(limit: $limit, offset: $offset) {
      items {
        name
        fullName
        description
        subscriberCount
        isActive
        college
      }
      totalCount
    }
  }
`;

export const GET_REDDIT_COMMUNITY = gql`
  query GetRedditCommunity($subredditName: String!) {
    redditCommunity(subredditName: $subredditName) {
      name
      fullName
      description
      subscriberCount
      isActive
      college
      url
      createdAt
    }
  }
`;

export const GET_WGU_CONNECT_GROUPS = gql`
  query GetWguConnectGroups($limit: Int, $offset: Int) {
    wguConnectGroups(limit: $limit, offset: $offset) {
      items {
        id
        name
        courseCode
        memberCount
        lastActivity
      }
      totalCount
    }
  }
`;

export const GET_WGU_CONNECT_GROUP = gql`
  query GetWguConnectGroup($groupId: String!) {
    wguConnectGroup(groupId: $groupId) {
      id
      name
      courseCode
      memberCount
      lastActivity
      description
      resources {
        id
        title
        type
        category
        link
      }
    }
  }
`;

export const GET_DEGREE_PLANS = gql`
  query GetDegreePlans($limit: Int, $offset: Int) {
    degreePlans(limit: $limit, offset: $offset) {
      items {
        id
        name
        code
        type
        college
        totalCUs
        description
      }
      totalCount
    }
  }
`;

export const GET_DEGREE_PLAN = gql`
  query GetDegreePlan($degreeId: String!) {
    degreePlan(degreeId: $degreeId) {
      id
      name
      code
      type
      college
      totalCUs
      description
      courses {
        courseCode
        name
        units
        term
        isCore
      }
      competencies
      certifications
    }
  }
`;

export const GET_STUDENT_GROUPS = gql`
  query GetStudentGroups($limit: Int, $offset: Int) {
    studentGroups(limit: $limit, offset: $offset) {
      items {
        id
        name
        type
        platform
        memberCount
        description
        tags
      }
      totalCount
    }
  }
`;

export const GET_STUDENT_GROUP = gql`
  query GetStudentGroup($studentGroupId: String!) {
    studentGroup(studentGroupId: $studentGroupId) {
      id
      name
      type
      platform
      memberCount
      description
      tags
      url
      admins
      created
      rules
      resources {
        title
        description
        url
        type
      }
    }
  }
`;
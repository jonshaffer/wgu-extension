/**
 * GraphQL queries for the site
 * Combines shared queries from packages with site-specific queries
 */

import {gql} from "@apollo/client/index.js";
import {queries as sharedQueries} from "../../../functions/lib/graphql/index";

// Re-export shared queries wrapped with gql tag
export const GET_COURSES = gql`${sharedQueries.GET_COURSES}`;
export const GET_COMMUNITIES = gql`${sharedQueries.GET_COMMUNITIES}`;
export const GET_COMMUNITIES_FOR_COURSE = gql`${sharedQueries.GET_COMMUNITIES_FOR_COURSE}`;
export const GET_DEGREE_PLANS = gql`${sharedQueries.GET_DEGREE_PLANS}`;

// Site-specific queries (not in shared package)
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

export const GET_COURSE = gql`
  query GetCourse($courseCode: String!) {
    course(courseCode: $courseCode) {
      courseCode
      name
      description
      competencyUnits
      level
      college
      lastUpdated
    }
  }
`;

export const GET_DISCORD_SERVERS = gql`
  query GetDiscordServers($limit: Int, $offset: Int) {
    discordServers(limit: $limit, offset: $offset) {
      items {
        serverId
        name
        invite
        description
        memberCount
        courseMappings
        icon
        lastChecked
      }
      totalCount
    }
  }
`;

export const GET_DISCORD_SERVER = gql`
  query GetDiscordServer($serverId: String!) {
    discordServer(serverId: $serverId) {
      serverId
      name
      invite
      description
      memberCount
      onlineCount
      icon
      banner
      courseMappings
      features
      boostLevel
      verificationLevel
      categories {
        id
        name
        channels {
          id
          name
          type
          description
        }
      }
      lastChecked
    }
  }
`;

export const GET_REDDIT_COMMUNITIES = gql`
  query GetRedditCommunities($limit: Int, $offset: Int) {
    redditCommunities(limit: $limit, offset: $offset) {
      items {
        subredditName
        displayName
        title
        description
        subscriberCount
        activeUserCount
        courseMappings
        icon
        isNsfw
        lastChecked
      }
      totalCount
    }
  }
`;

export const GET_REDDIT_COMMUNITY = gql`
  query GetRedditCommunity($subredditName: String!) {
    redditCommunity(subredditName: $subredditName) {
      subredditName
      displayName
      title
      description
      subscriberCount
      activeUserCount
      courseMappings
      icon
      banner
      isNsfw
      rules {
        name
        description
      }
      lastChecked
    }
  }
`;

export const GET_WGU_CONNECT_GROUPS = gql`
  query GetWguConnectGroups($limit: Int, $offset: Int) {
    wguConnectGroups(limit: $limit, offset: $offset) {
      items {
        groupId
        name
        courseCode
        description
        memberCount
        postCount
        lastActivity
      }
      totalCount
    }
  }
`;

export const GET_WGU_CONNECT_GROUP = gql`
  query GetWguConnectGroup($groupId: String!) {
    wguConnectGroup(groupId: $groupId) {
      groupId
      name
      courseCode
      description
      memberCount
      postCount
      lastActivity
      resources {
        id
        title
        type
        url
        author
        timestamp
        upvotes
      }
    }
  }
`;

export const GET_DEGREE_PLAN = gql`
  query GetDegreePlan($degreeId: String!) {
    degreePlan(degreeId: $degreeId) {
      degreeId
      name
      code
      description
      college
      level
      totalCUs
      courses {
        courseCode
        name
        competencyUnits
        term
        isCore
      }
      lastUpdated
    }
  }
`;

export const GET_STUDENT_GROUPS = gql`
  query GetStudentGroups($limit: Int, $offset: Int) {
    studentGroups(limit: $limit, offset: $offset) {
      items {
        studentGroupId
        name
        description
        category
        memberCount
        platform
        joinUrl
        courseMappings
        icon
        isOfficial
        lastChecked
      }
      totalCount
    }
  }
`;

export const GET_STUDENT_GROUP = gql`
  query GetStudentGroup($studentGroupId: String!) {
    studentGroup(studentGroupId: $studentGroupId) {
      studentGroupId
      name
      description
      category
      memberCount
      platform
      joinUrl
      courseMappings
      icon
      banner
      isOfficial
      socialLinks {
        platform
        url
      }
      lastChecked
    }
  }
`;

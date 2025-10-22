import {GraphQLError} from "graphql";
import {db} from "../lib/firebase.js";
import {COLLECTIONS, RedditCommunity, CourseCommunityMapping} from "../lib/data-model.js";

interface RedditSearchArgs {
  query: string;
  subreddits: string[];
  sortBy?: "NEW" | "HOT" | "TOP" | "RELEVANCE" | "COMMENTS";
  timeWindow?: "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR" | "ALL";
  limit?: number;
}

interface RedditPost {
  id: string;
  title: string;
  text?: string;
  url: string;
  author: string;
  subreddit: string;
  score: number;
  upvoteRatio?: number;
  numComments: number;
  created: string;
  permalink: string;
  tags: string[];
}

interface RedditSearchResponse {
  results: RedditPost[];
  totalCount: number;
  searchQuery: string;
  subreddits: string[];
  sortBy: string;
  timeWindow: string;
}

// This resolver reads from our cached Reddit data in Firestore
// It does NOT make live API calls to Reddit during query execution
export async function searchSubredditsResolver(
  _parent: any,
  args: RedditSearchArgs
): Promise<RedditSearchResponse> {
  const {query, subreddits, sortBy = "NEW", timeWindow = "WEEK", limit = 50} = args;

  // Validate input
  if (!query || query.trim().length === 0) {
    throw new GraphQLError("Search query cannot be empty");
  }

  if (!subreddits || subreddits.length === 0) {
    throw new GraphQLError("At least one subreddit must be specified");
  }

  if (subreddits.length > 10) {
    throw new GraphQLError("Maximum of 10 subreddits can be searched at once");
  }

  if (limit > 100) {
    throw new GraphQLError("Limit cannot exceed 100");
  }

  // Sanitize subreddit names (remove r/ prefix if present)
  const cleanSubreddits = subreddits.map((sub) =>
    sub.startsWith("r/") ? sub.substring(2) : sub
  );

  try {
    // First, verify the subreddits exist in our system
    const subredditPromises = cleanSubreddits.map(async (subredditName) => {
      const subredditDoc = await db
        .collection(COLLECTIONS.REDDIT_COMMUNITIES)
        .doc(subredditName)
        .get();
      return subredditDoc.exists ? subredditDoc.data() as RedditCommunity : null;
    });

    const subredditData = await Promise.all(subredditPromises);
    const validSubreddits = subredditData.filter((s) => s !== null) as RedditCommunity[];

    if (validSubreddits.length === 0) {
      return {
        results: [],
        totalCount: 0,
        searchQuery: query,
        subreddits: cleanSubreddits,
        sortBy,
        timeWindow,
      };
    }

    // Search for posts in our cached Reddit data
    // For now, we'll return placeholder data based on the communities
    // In a real implementation, this would query a reddit-posts collection
    const results: RedditPost[] = [];

    // Get top posts from course community mappings
    for (const subreddit of validSubreddits) {
      if (subreddit.associatedCourses && subreddit.associatedCourses.length > 0) {
        // Get posts from course mappings
        const courseCode = subreddit.associatedCourses[0];
        const mappingDoc = await db
          .collection(COLLECTIONS.COURSE_MAPPINGS)
          .doc(courseCode)
          .get();

        if (mappingDoc.exists) {
          const mapping = mappingDoc.data() as CourseCommunityMapping;
          if (mapping.topRedditPosts) {
            mapping.topRedditPosts
              .filter((post) =>
                post.title.toLowerCase().includes(query.toLowerCase()) ||
                (post.url && post.url.toLowerCase().includes(query.toLowerCase()))
              )
              .slice(0, Math.floor(limit / validSubreddits.length))
              .forEach((post) => {
                results.push({
                  id: post.postId,
                  title: post.title,
                  text: undefined,
                  url: post.url,
                  author: "cached_user",
                  subreddit: subreddit.id,
                  score: post.score,
                  upvoteRatio: undefined,
                  numComments: post.commentCount,
                  created: post.createdAt.toISOString(),
                  permalink: post.url,
                  tags: subreddit.tags || [],
                });
              });
          }
        }
      }

      // Add placeholder posts for communities without cached posts
      if (results.length < 3) {
        results.push({
          id: `placeholder_${subreddit.id}_${Date.now()}`,
          title: `${query} in r/${subreddit.id}`,
          text: `Search results for "${query}" in the ${subreddit.name} community`,
          url: subreddit.url,
          author: "community_bot",
          subreddit: subreddit.id,
          score: subreddit.subscriberCount || 0,
          upvoteRatio: 0.95,
          numComments: 0,
          created: new Date().toISOString(),
          permalink: subreddit.url,
          tags: subreddit.tags || [],
        });
      }
    }

    // Sort results based on sortBy parameter
    if (sortBy === "TOP" || sortBy === "HOT") {
      results.sort((a, b) => b.score - a.score);
    } else if (sortBy === "NEW") {
      results.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    } else if (sortBy === "COMMENTS") {
      results.sort((a, b) => b.numComments - a.numComments);
    }

    // Apply limit
    const limitedResults = results.slice(0, limit);

    return {
      results: limitedResults,
      totalCount: results.length,
      searchQuery: query,
      subreddits: cleanSubreddits,
      sortBy,
      timeWindow,
    };
  } catch (error) {
    console.error("Error searching Reddit posts:", error);
    throw new GraphQLError("Failed to search Reddit posts");
  }
}

// Utility function to convert Reddit API sort parameter to our GraphQL enum
export function mapSortByToRedditAPI(sortBy: string): string {
  const mapping: Record<string, string> = {
    NEW: "new",
    HOT: "hot",
    TOP: "top",
    RELEVANCE: "relevance",
    COMMENTS: "comments",
  };
  return mapping[sortBy] || "new";
}

// Utility function to convert Reddit API time parameter to our GraphQL enum
export function mapTimeWindowToRedditAPI(timeWindow: string): string {
  const mapping: Record<string, string> = {
    HOUR: "hour",
    DAY: "day",
    WEEK: "week",
    MONTH: "month",
    YEAR: "year",
    ALL: "all",
  };
  return mapping[timeWindow] || "week";
}

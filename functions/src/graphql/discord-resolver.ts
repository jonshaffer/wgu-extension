import {searchCommunities, getTrendingCommunities} from "../lib/data-queries.js";
import {defaultDb as db} from "../lib/firebase-admin-db.js";
import {DiscordServer} from "../lib/data-model.js";

interface DiscordServersArgs {
  search?: string;
  courseCode?: string;
  limit?: number;
}

export async function discordServersResolver(
  _parent: unknown,
  args: DiscordServersArgs
): Promise<DiscordServer[]> {
  const {search, courseCode, limit = 20} = args;

  try {
    if (search || courseCode) {
      // Use the community search index
      const results = await searchCommunities(search || "", {
        type: "discord",
        courseCodes: courseCode ? [courseCode] : undefined,
        verified: undefined, // Include both verified and unverified
      }, limit);

      // Fetch full Discord server data for the results
      const serverIds = results.map((r) => r.resourceId);
      if (serverIds.length === 0) {
        return [];
      }

      const serverPromises = serverIds.map((id) =>
        db.collection("discord-servers").doc(id).get()
      );
      const serverDocs = await Promise.all(serverPromises);

      return serverDocs
        .filter((doc) => doc.exists)
        .map((doc) => {
          const data = doc.data()!;
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            inviteUrl: data.inviteUrl,
            memberCount: data.memberCount,
            channels: data.channels,
            tags: data.tags || [],
            verified: data.verified || false,
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
          } as DiscordServer;
        });
    } else {
      // No filters - return trending Discord servers
      const trending = await getTrendingCommunities(limit);
      return trending.discord;
    }
  } catch (error) {
    console.error("Error in discordServersResolver:", error);
    return [];
  }
}

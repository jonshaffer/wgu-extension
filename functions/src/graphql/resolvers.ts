import { db } from "../lib/firebase";

export const resolvers = {
  Query: {
    ping: () => "pong",
    unifiedCommunityData: async () => {
      const docRef = db.collection("public").doc("unifiedCommunityData");
      const snap = await docRef.get();
      if (!snap.exists) return null;
      const data = snap.data() || {};
      // Normalize shape and add minimal defaults
      const payload = {
        discordServers: Array.isArray(data.discordServers) ? data.discordServers : [],
        courseMappings: Array.isArray(data.courseMappings) ? data.courseMappings : [],
        universityLevel: data.universityLevel ?? null,
        updatedAt: data.updatedAt ?? null,
        etag: data.etag ?? null,
      } as any;
      return payload;
    },
  },
};

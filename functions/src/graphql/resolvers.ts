import {searchResolver} from "./search-resolver";

// Simple resolvers for collection-based sync
async function coursesResolver() {
  return {items: [], totalCount: 0};
}

async function degreePlansResolver() {
  return {items: [], totalCount: 0};
}

export const resolvers = {
  Query: {
    ping: () => "pong",
    search: searchResolver,
    courses: coursesResolver,
    degreePlans: degreePlansResolver,
  },
};

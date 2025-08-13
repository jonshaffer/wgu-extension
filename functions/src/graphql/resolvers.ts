import {searchResolver} from "./search-resolver";

export const resolvers = {
  Query: {
    ping: () => "pong",
    search: searchResolver,
  },
};

import React from "react";
import {Link} from "react-router";
import {useQuery} from "@apollo/client/index.js";
import {motion} from "motion/react";
import {GET_REDDIT_COMMUNITIES} from "~/graphql/queries";
import {ResourceLayout} from "~/components/ResourceLayout";
import {Container} from "~/components/ui/container";
import {Card} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {ArrowLeft, Users, Search, ChevronLeft, ChevronRight, TrendingUp} from "lucide-react";
import type {Route} from "./+types/index";

export function meta(_args: Route.MetaArgs) {
  return [
    {title: "Reddit Communities - WGU Extension"},
    {name: "description", content: "Find WGU-related Reddit communities and subreddits"},
  ];
}

interface RedditCommunity {
  name: string;
  description?: string;
  memberCount?: number;
  url: string;
  created?: string;
  type?: string;
}

export default function RedditIndex() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [page, setPage] = React.useState(0);
  const pageSize = 12;

  const {data, loading, error} = useQuery(GET_REDDIT_COMMUNITIES, {
    variables: {
      limit: pageSize,
      offset: page * pageSize,
    },
  });

  const filteredCommunities = React.useMemo(() => {
    if (!data?.redditCommunities?.items) return [];
    if (!searchTerm) return data.redditCommunities.items;

    const term = searchTerm.toLowerCase();
    return data.redditCommunities.items.filter((community: RedditCommunity) =>
      community.name.toLowerCase().includes(term) ||
      community.description?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil((data?.redditCommunities?.totalCount || 0) / pageSize);

  const formatMemberCount = (count?: number) => {
    if (!count) return "Unknown";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  return (
    <ResourceLayout>
      {/* Header */}
      <motion.header
        initial={{y: -20, opacity: 0}}
        animate={{y: 0, opacity: 1}}
        transition={{duration: 0.4}}
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <Container className="py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to home</span>
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                Reddit Communities
              </h1>
              <p className="text-sm text-muted-foreground">
                WGU-related Reddit communities
              </p>
            </div>
          </div>
        </Container>
      </motion.header>

      <main className="py-8">
        <Container>
          {/* Search Bar */}
          <motion.div
            initial={{y: 20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{delay: 0.1, duration: 0.4}}
            className="mb-6"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Reddit communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              className="text-center py-16"
            >
              <p className="text-destructive">Failed to load Reddit communities. Please try again.</p>
            </motion.div>
          )}

          {/* Communities Grid */}
          {!loading && !error && (
            <>
              <motion.div
                initial={{y: 20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{delay: 0.2, duration: 0.4}}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              >
                {filteredCommunities.map((community: RedditCommunity, index: number) => (
                  <motion.div
                    key={community.name}
                    initial={{y: 20, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{delay: 0.1 + index * 0.02, duration: 0.3}}
                  >
                    <Link to={`/reddit/${community.name}`}>
                      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-lg">r/{community.name}</h3>
                            {community.memberCount && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                <span>{formatMemberCount(community.memberCount)}</span>
                              </div>
                            )}
                          </div>
                          {community.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {community.description}
                            </p>
                          )}
                          {community.type && (
                            <Badge variant="secondary" className="text-xs">
                              {community.type}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  initial={{y: 20, opacity: 0}}
                  animate={{y: 0, opacity: 1}}
                  transition={{delay: 0.3, duration: 0.4}}
                  className="flex items-center justify-center gap-2"
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </Container>
      </main>
    </ResourceLayout>
  );
}

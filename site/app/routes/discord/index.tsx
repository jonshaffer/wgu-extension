import React from "react";
import {Link} from "react-router";
import {useQuery} from "@apollo/client/index.js";
import {motion} from "motion/react";
import {GET_DISCORD_SERVERS} from "~/graphql/queries";
import {ResourceLayout} from "~/components/ResourceLayout";
import {Container} from "~/components/ui/container";
import {Card} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {ArrowLeft, MessageCircle, Search, Users, ChevronLeft, ChevronRight} from "lucide-react";
import type {Route} from "./+types/index";

export function meta(_args: Route.MetaArgs) {
  return [
    {title: "Discord Servers - WGU Extension"},
    {name: "description", content: "Find WGU-related Discord servers and communities"},
  ];
}

interface DiscordServer {
  id: string;
  name: string;
  icon?: string;
  memberCount?: number;
  description?: string;
  categories?: string[];
}

export default function DiscordIndex() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [page, setPage] = React.useState(0);
  const pageSize = 12;

  const {data, loading, error} = useQuery(GET_DISCORD_SERVERS, {
    variables: {
      limit: pageSize,
      offset: page * pageSize,
    },
  });

  const filteredServers = React.useMemo(() => {
    if (!data?.discordServers?.items) return [];
    if (!searchTerm) return data.discordServers.items;

    const term = searchTerm.toLowerCase();
    return data.discordServers.items.filter((server: DiscordServer) =>
      server.name.toLowerCase().includes(term) ||
      server.description?.toLowerCase().includes(term) ||
      server.categories?.some((cat) => cat.toLowerCase().includes(term))
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil((data?.discordServers?.totalCount || 0) / pageSize);

  const getServerIcon = (server: DiscordServer) => {
    if (server.icon) {
      return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`;
    }
    return null;
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
                <MessageCircle className="h-6 w-6" />
                Discord Servers
              </h1>
              <p className="text-sm text-muted-foreground">
                WGU-related Discord communities
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
                placeholder="Search Discord servers..."
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
              <p className="text-destructive">Failed to load Discord servers. Please try again.</p>
            </motion.div>
          )}

          {/* Servers Grid */}
          {!loading && !error && (
            <>
              <motion.div
                initial={{y: 20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{delay: 0.2, duration: 0.4}}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              >
                {filteredServers.map((server: DiscordServer, index: number) => (
                  <motion.div
                    key={server.id}
                    initial={{y: 20, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{delay: 0.1 + index * 0.02, duration: 0.3}}
                  >
                    <Link to={`/discord/${server.id}`}>
                      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            {getServerIcon(server) ? (
                              <img
                                src={getServerIcon(server)!}
                                alt={server.name}
                                className="w-12 h-12 rounded-full"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <MessageCircle className="h-6 w-6 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate">{server.name}</h3>
                              {server.memberCount && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  <span>{server.memberCount.toLocaleString()} members</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {server.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {server.description}
                            </p>
                          )}
                          {server.categories && server.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {server.categories.slice(0, 3).map((category) => (
                                <Badge key={category} variant="secondary" className="text-xs">
                                  {category}
                                </Badge>
                              ))}
                              {server.categories.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{server.categories.length - 3} more
                                </Badge>
                              )}
                            </div>
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

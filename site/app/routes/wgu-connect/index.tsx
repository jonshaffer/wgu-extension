import React from "react";
import {Link} from "react-router";
import {useQuery} from "@apollo/client/index.js";
import {motion} from "motion/react";
import {GET_WGU_CONNECT_GROUPS} from "~/graphql/queries";
import {ResourceLayout} from "~/components/ResourceLayout";
import {Container} from "~/components/ui/container";
import {Card} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {ArrowLeft, BookOpen, Search, ChevronLeft, ChevronRight, Users} from "lucide-react";
import type {Route} from "./+types/index";

export function meta(_args: Route.MetaArgs) {
  return [
    {title: "WGU Connect Groups - WGU Extension"},
    {name: "description", content: "Find official WGU Connect study groups and resources"},
  ];
}

interface WguConnectGroup {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  courseCode?: string;
  type?: string;
  url?: string;
}

export default function WguConnectIndex() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [page, setPage] = React.useState(0);
  const pageSize = 12;

  const {data, loading, error} = useQuery(GET_WGU_CONNECT_GROUPS, {
    variables: {
      limit: pageSize,
      offset: page * pageSize,
    },
  });

  const filteredGroups = React.useMemo(() => {
    if (!data?.wguConnectGroups?.items) return [];
    if (!searchTerm) return data.wguConnectGroups.items;

    const term = searchTerm.toLowerCase();
    return data.wguConnectGroups.items.filter((group: WguConnectGroup) =>
      group.name.toLowerCase().includes(term) ||
      group.description?.toLowerCase().includes(term) ||
      group.courseCode?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil((data?.wguConnectGroups?.totalCount || 0) / pageSize);

  const getGroupTypeLabel = (type?: string) => {
    switch (type) {
    case "course":
      return "Course Group";
    case "degree":
      return "Degree Program";
    case "general":
      return "General Discussion";
    default:
      return "Study Group";
    }
  };

  const getGroupTypeVariant = (type?: string): "default" | "secondary" | "outline" => {
    switch (type) {
    case "course":
      return "default";
    case "degree":
      return "secondary";
    default:
      return "outline";
    }
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
                <BookOpen className="h-6 w-6" />
                WGU Connect Groups
              </h1>
              <p className="text-sm text-muted-foreground">
                Official study groups and resources
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
                placeholder="Search WGU Connect groups..."
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
              <p className="text-destructive">Failed to load WGU Connect groups. Please try again.</p>
            </motion.div>
          )}

          {/* Groups Grid */}
          {!loading && !error && (
            <>
              <motion.div
                initial={{y: 20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{delay: 0.2, duration: 0.4}}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              >
                {filteredGroups.map((group: WguConnectGroup, index: number) => (
                  <motion.div
                    key={group.id}
                    initial={{y: 20, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{delay: 0.1 + index * 0.02, duration: 0.3}}
                  >
                    <Link to={`/wgu-connect/${group.id}`}>
                      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-2">{group.name}</h3>
                            {group.courseCode && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {group.courseCode}
                              </p>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {group.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <Badge variant={getGroupTypeVariant(group.type)}>
                              {getGroupTypeLabel(group.type)}
                            </Badge>
                            {group.memberCount && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{group.memberCount.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
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

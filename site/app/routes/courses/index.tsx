import React from "react";
import {Link} from "react-router";
import {useQuery} from "@apollo/client/index.js";
import {motion} from "motion/react";
import {GET_COURSES} from "~/graphql/queries";
import {ResourceLayout} from "~/components/ResourceLayout";
import {Container} from "~/components/ui/container";
import {Card} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {ArrowLeft, BookOpen, Search, ChevronLeft, ChevronRight} from "lucide-react";
import type {Route} from "./+types/index";

export function meta(_args: Route.MetaArgs) {
  return [
    {title: "Courses - WGU Extension"},
    {name: "description", content: "Browse all WGU courses and find community resources for each"},
  ];
}

interface Course {
  courseCode: string;
  name: string;
  units: number;
  level: string;
  competencyUnits: number;
}

export default function CoursesIndex() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [page, setPage] = React.useState(0);
  const pageSize = 20;

  const {data, loading, error} = useQuery(GET_COURSES, {
    variables: {
      limit: pageSize,
      offset: page * pageSize,
    },
  });

  const filteredCourses = React.useMemo(() => {
    if (!data?.courses?.items) return [];
    if (!searchTerm) return data.courses.items;

    const term = searchTerm.toLowerCase();
    return data.courses.items.filter((course: Course) =>
      course.courseCode.toLowerCase().includes(term) ||
      course.name.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil((data?.courses?.totalCount || 0) / pageSize);

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
    case "Lower":
      return "secondary";
    case "Upper":
      return "default";
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
                WGU Courses
              </h1>
              <p className="text-sm text-muted-foreground">
                Browse all courses and find community resources
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
                placeholder="Search courses by code or name..."
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
              <p className="text-destructive">Failed to load courses. Please try again.</p>
            </motion.div>
          )}

          {/* Courses Grid */}
          {!loading && !error && (
            <>
              <motion.div
                initial={{y: 20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{delay: 0.2, duration: 0.4}}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
              >
                {filteredCourses.map((course: Course, index: number) => (
                  <motion.div
                    key={course.courseCode}
                    initial={{y: 20, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{delay: 0.1 + index * 0.02, duration: 0.3}}
                  >
                    <Link to={`/courses/${course.courseCode}`}>
                      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-lg">{course.courseCode}</h3>
                            <Badge variant={getLevelBadgeVariant(course.level)}>
                              {course.level}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.name}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              {course.units} CU{course.units !== 1 ? "s" : ""}
                            </span>
                            {course.competencyUnits > 0 && (
                              <span className="text-muted-foreground">
                                {course.competencyUnits} Competenc{course.competencyUnits !== 1 ? "ies" : "y"}
                              </span>
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

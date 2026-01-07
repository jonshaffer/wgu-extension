import React from "react";
import {Link, useParams} from "react-router";
import {useQuery} from "@apollo/client/index.js";
import {motion} from "motion/react";
import {GET_COURSE} from "~/graphql/queries";
import {ResourceLayout} from "~/components/ResourceLayout";
import {Container} from "~/components/ui/container";
import {Card} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  FileText,
  ExternalLink,
  MessageCircle,
  Users,
} from "lucide-react";
import type {Route} from "./+types/details";

export function meta({params}: Route.MetaArgs) {
  return [
    {title: `${params.courseCode} - WGU Extension`},
    {name: "description", content: `View details and community resources for ${params.courseCode}`},
  ];
}

interface Course {
  courseCode: string;
  name: string;
  description?: string;
  units: number;
  level: string;
  competencyUnits: number;
  prerequisites?: string[];
  corequisites?: string[];
}

export default function CourseDetails() {
  const params = useParams();
  const courseCode = params.courseCode || "";

  const {data, loading, error} = useQuery(GET_COURSE, {
    variables: {courseCode},
    skip: !courseCode,
  });

  const course: Course | undefined = data?.course;

  if (loading) {
    return (
      <ResourceLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </ResourceLayout>
    );
  }

  if (error || !course) {
    return (
      <ResourceLayout>
        <Container className="py-16">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The course &ldquo;{courseCode}&rdquo; could not be found.
            </p>
            <Button asChild>
              <Link to="/courses">Browse All Courses</Link>
            </Button>
          </Card>
        </Container>
      </ResourceLayout>
    );
  }

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
              <Link to="/courses">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to courses</span>
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{course.courseCode}</h1>
                <Badge variant={course.level === "Upper" ? "default" : "secondary"}>
                  {course.level}
                </Badge>
              </div>
              <p className="text-muted-foreground">{course.name}</p>
            </div>
          </div>
        </Container>
      </motion.header>

      <main className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Course Info */}
              <motion.div
                initial={{y: 20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{delay: 0.1, duration: 0.4}}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Information
                  </h2>
                  <div className="space-y-4">
                    {course.description && (
                      <div>
                        <h3 className="font-medium mb-2">Description</h3>
                        <p className="text-muted-foreground">{course.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-1">Credit Units</h3>
                        <p className="text-muted-foreground">{course.units} CUs</p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Competencies</h3>
                        <p className="text-muted-foreground">{course.competencyUnits}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Prerequisites & Corequisites */}
              {(
                (course.prerequisites && course.prerequisites.length > 0) ||
                (course.corequisites && course.corequisites.length > 0)
              ) && (
                <motion.div
                  initial={{y: 20, opacity: 0}}
                  animate={{y: 0, opacity: 1}}
                  transition={{delay: 0.2, duration: 0.4}}
                >
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Requirements
                    </h2>
                    <div className="space-y-4">
                      {course.prerequisites && course.prerequisites.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Prerequisites</h3>
                          <div className="flex flex-wrap gap-2">
                            {course.prerequisites.map((prereq: string) => (
                              <Link key={prereq} to={`/courses/${prereq}`}>
                                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                  {prereq}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {course.corequisites && course.corequisites.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Corequisites</h3>
                          <div className="flex flex-wrap gap-2">
                            {course.corequisites.map((coreq: string) => (
                              <Link key={coreq} to={`/courses/${coreq}`}>
                                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                  {coreq}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Community Resources */}
              <motion.div
                initial={{y: 20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{delay: 0.3, duration: 0.4}}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Community Resources
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Search for community resources related to this course:
                  </p>
                  <div className="space-y-3">
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link to={`/search?q=${courseCode}`}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Search Discord Servers
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link to={`/search?q=${courseCode}`}>
                        <Users className="h-4 w-4 mr-2" />
                        Search Reddit Communities
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link to={`/search?q=${courseCode}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Search Study Groups
                      </Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <motion.div
                initial={{y: 20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{delay: 0.4, duration: 0.4}}
              >
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <Link to={`/search?q=${courseCode}`}>
                        Search Resources
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/suggest">
                        Suggest a Resource
                      </Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>

              {/* Related Links */}
              <motion.div
                initial={{y: 20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{delay: 0.5, duration: 0.4}}
              >
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">External Resources</h3>
                  <div className="space-y-2">
                    <a
                      href={`https://my.wgu.edu/courses/${courseCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on WGU Portal
                    </a>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </Container>
      </main>
    </ResourceLayout>
  );
}

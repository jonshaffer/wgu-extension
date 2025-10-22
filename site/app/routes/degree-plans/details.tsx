import React from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@apollo/client/index.js';
import { motion } from 'motion/react';
import { GET_DEGREE_PLAN } from '~/graphql/queries';
import { Container } from '~/components/ui/container';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { 
  ArrowLeft, 
  GraduationCap,
  BookOpen,
  Award,
  ExternalLink,
  CheckCircle,
  Info
} from 'lucide-react';
import type { Route } from "./+types/details";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Degree Plan - WGU Extension` },
    { name: "description", content: `View degree requirements and course sequence` },
  ];
}

interface Course {
  courseCode: string;
  name: string;
  units: number;
  term?: number;
  isCore?: boolean;
}

interface DegreePlan {
  id: string;
  name: string;
  code: string;
  type: string;
  college: string;
  totalCUs: number;
  description?: string;
  courses?: Course[];
  competencies?: string[];
  certifications?: string[];
}

export default function DegreePlanDetails() {
  const params = useParams();
  const degreeId = params.degreeId || '';

  const { data, loading, error } = useQuery(GET_DEGREE_PLAN, {
    variables: { degreeId },
    skip: !degreeId
  });

  const degree: DegreePlan | undefined = data?.degreePlan;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !degree) {
    return (
      <div className="min-h-screen bg-background">
        <Container className="py-16">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Degree Plan Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The degree plan could not be found.
            </p>
            <Button asChild>
              <Link to="/degree-plans">Browse All Degree Plans</Link>
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  const getDegreeTypeLabel = (type: string) => {
    switch (type) {
      case 'bachelor':
        return "Bachelor's Degree";
      case 'master':
        return "Master's Degree";
      default:
        return type;
    }
  };

  // Group courses by term
  const coursesByTerm = React.useMemo(() => {
    if (!degree.courses) return {};
    
    const grouped: Record<number, Course[]> = {};
    degree.courses.forEach(course => {
      const term = course.term || 0;
      if (!grouped[term]) {
        grouped[term] = [];
      }
      grouped[term].push(course);
    });
    
    return grouped;
  }, [degree.courses]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <Container className="py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
            >
              <Link to="/degree-plans">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to degree plans</span>
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold line-clamp-1">{degree.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-muted-foreground">{degree.code}</span>
                <Badge variant="secondary">{degree.college}</Badge>
                <Badge variant="outline">{degree.totalCUs} CUs</Badge>
              </div>
            </div>
          </div>
        </Container>
      </motion.header>

      <main className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Program Info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Program Information
                  </h2>
                  <div className="space-y-4">
                    {degree.description && (
                      <div>
                        <h3 className="font-medium mb-2">Description</h3>
                        <p className="text-muted-foreground">{degree.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-1">Degree Type</h3>
                        <p className="text-muted-foreground">{getDegreeTypeLabel(degree.type)}</p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Total Credit Units</h3>
                        <p className="text-muted-foreground">{degree.totalCUs} CUs</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Course Sequence */}
              {degree.courses && degree.courses.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Course Sequence
                    </h2>
                    <div className="space-y-6">
                      {Object.entries(coursesByTerm).map(([term, courses]) => (
                        <div key={term}>
                          {term !== '0' && (
                            <h3 className="font-medium text-sm text-muted-foreground mb-3 uppercase">
                              Term {term}
                            </h3>
                          )}
                          <div className="space-y-2">
                            {courses.map((course) => (
                              <Link
                                key={course.courseCode}
                                to={`/courses/${course.courseCode}`}
                                className="block border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{course.courseCode}</span>
                                      {course.isCore && (
                                        <Badge variant="default" className="text-xs">Core</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {course.name}
                                    </p>
                                  </div>
                                  <Badge variant="outline">{course.units} CUs</Badge>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Certifications */}
              {degree.certifications && degree.certifications.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Industry Certifications
                    </h2>
                    <div className="space-y-2">
                      {degree.certifications.map((cert, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <a 
                        href={`https://www.wgu.edu/online-it-degrees/${degree.code.toLowerCase()}.html`}
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on WGU.edu
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/search?q=${degree.name}`}>
                        Search Communities
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

              {/* Competencies */}
              {degree.competencies && degree.competencies.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Key Competencies</h3>
                    <div className="space-y-2">
                      {degree.competencies.slice(0, 5).map((comp, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          • {comp}
                        </div>
                      ))}
                      {degree.competencies.length > 5 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          +{degree.competencies.length - 5} more
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Related */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Find More</h3>
                  <div className="space-y-2">
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link to="/degree-plans">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Browse All Degrees
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link to="/courses">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Browse All Courses
                      </Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
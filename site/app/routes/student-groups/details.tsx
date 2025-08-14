import React from 'react';
import { useQuery } from '@apollo/client/index.js';
import { Link, useParams } from 'react-router';
import type { Route } from './+types/details';
import { Navigation } from '~/components/Navigation';
import { Footer } from '~/components/Footer';
import { Container } from '~/components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { ArrowLeft, ExternalLink, Users, Calendar, Hash, Link as LinkIcon } from 'lucide-react';
import { GET_STUDENT_GROUP } from '~/graphql/queries';

interface StudentGroupResource {
  title: string;
  description?: string;
  url: string;
  type: string;
}

interface StudentGroup {
  id: string;
  name: string;
  type: string;
  platform: string;
  memberCount?: number;
  description?: string;
  tags?: string[];
  url?: string;
  admins?: string[];
  created?: string;
  rules?: string[];
  resources?: StudentGroupResource[];
}

interface StudentGroupData {
  studentGroup: StudentGroup;
}

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Student Group - WGU Extension` },
    { name: 'description', content: 'View details about this WGU student group' },
  ];
}

export default function StudentGroupDetailPage() {
  const { studentGroupId } = useParams();
  const { loading, error, data } = useQuery<StudentGroupData>(GET_STUDENT_GROUP, {
    variables: { studentGroupId },
    skip: !studentGroupId,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-8">
        <Container>
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/student-groups" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Student Groups
              </Link>
            </Button>
          </div>

          {loading && (
            <div className="space-y-6">
              <Skeleton className="h-8 w-1/2" />
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-6 w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">Error loading student group: {error.message}</p>
              </CardContent>
            </Card>
          )}

          {data?.studentGroup && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">{data.studentGroup.name}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="default" className="text-sm">
                    {data.studentGroup.type}
                  </Badge>
                  {data.studentGroup.platform && (
                    <Badge variant="secondary" className="text-sm">
                      {data.studentGroup.platform}
                    </Badge>
                  )}
                  {data.studentGroup.memberCount && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{data.studentGroup.memberCount.toLocaleString()} members</span>
                    </div>
                  )}
                  {data.studentGroup.created && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Created {new Date(data.studentGroup.created).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  {data.studentGroup.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle>About</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {data.studentGroup.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {data.studentGroup.rules && data.studentGroup.rules.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Community Rules</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal list-inside space-y-2">
                          {data.studentGroup.rules.map((rule, index) => (
                            <li key={index} className="text-sm text-muted-foreground">
                              {rule}
                            </li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                  )}

                  {data.studentGroup.resources && data.studentGroup.resources.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Resources</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {data.studentGroup.resources.map((resource, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold mb-1">{resource.title}</h4>
                                  {resource.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {resource.description}
                                    </p>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {resource.type}
                                  </Badge>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                  <a 
                                    href={resource.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                  >
                                    <LinkIcon className="h-3 w-3" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  {data.studentGroup.url && (
                    <Card>
                      <CardContent className="pt-6">
                        <Button className="w-full" asChild>
                          <a 
                            href={data.studentGroup.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            Visit Group
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {data.studentGroup.tags && data.studentGroup.tags.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {data.studentGroup.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              <Hash className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {data.studentGroup.admins && data.studentGroup.admins.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Administrators</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {data.studentGroup.admins.map((admin, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              {admin}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </Container>
      </main>
      
      <Footer />
    </div>
  );
}
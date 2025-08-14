import React from 'react';
import { useQuery } from '@apollo/client/index.js';
import { Link } from 'react-router';
import type { Route } from './+types/index';
import { ResourceLayout } from '~/components/ResourceLayout';
import { Container } from '~/components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Users, Hash, Calendar, ExternalLink } from 'lucide-react';
import { GET_STUDENT_GROUPS } from '~/graphql/queries';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Student Groups - WGU Extension' },
    { name: 'description', content: 'Browse WGU student groups and organizations' },
  ];
}

interface StudentGroup {
  id: string;
  name: string;
  type: string;
  platform: string;
  memberCount?: number;
  description?: string;
  tags?: string[];
}

interface StudentGroupsData {
  studentGroups: {
    items: StudentGroup[];
    totalCount: number;
  };
}

export default function StudentGroupsPage() {
  const { loading, error, data } = useQuery<StudentGroupsData>(GET_STUDENT_GROUPS, {
    variables: { limit: 100 },
  });

  return (
    <ResourceLayout>
      
      <main className="py-8">
        <Container>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">WGU Student Groups</h1>
            <p className="text-muted-foreground">
              Official and community-led student organizations at WGU
            </p>
          </div>

          {loading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">Error loading student groups: {error.message}</p>
              </CardContent>
            </Card>
          )}

          {data && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {data.studentGroups.totalCount} student groups
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.studentGroups.items.map((group) => (
                  <Link 
                    key={group.id} 
                    to={`/student-groups/${group.id}`}
                    className="block"
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg line-clamp-2">
                            {group.name}
                          </CardTitle>
                          <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">{group.type}</Badge>
                            {group.platform && (
                              <Badge variant="outline">{group.platform}</Badge>
                            )}
                          </div>
                          
                          {group.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {group.description}
                            </p>
                          )}
                          
                          {group.memberCount && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{group.memberCount.toLocaleString()} members</span>
                            </div>
                          )}
                          
                          {group.tags && group.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {group.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  <Hash className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {group.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{group.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </Container>
      </main>
    </ResourceLayout>
  );
}
import React from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@apollo/client/index.js';
import { motion } from 'motion/react';
import { GET_WGU_CONNECT_GROUP } from '~/graphql/queries';
import { Container } from '~/components/ui/container';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { 
  ArrowLeft, 
  BookOpen,
  Users,
  Calendar,
  ExternalLink,
  MessageSquare,
  FileText,
  CheckCircle
} from 'lucide-react';
import type { Route } from "./+types/details";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `WGU Connect Group - WGU Extension` },
    { name: "description", content: `View details for WGU Connect study group` },
  ];
}

interface Resource {
  title: string;
  description?: string;
  url?: string;
  type?: string;
}

interface WguConnectGroup {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  courseCode?: string;
  type?: string;
  url?: string;
  created?: string;
  resources?: Resource[];
  guidelines?: string[];
}

export default function WguConnectDetails() {
  const params = useParams();
  const groupId = params.groupId || '';

  const { data, loading, error } = useQuery(GET_WGU_CONNECT_GROUP, {
    variables: { groupId },
    skip: !groupId
  });

  const group: WguConnectGroup | undefined = data?.wguConnectGroup;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-background">
        <Container className="py-16">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Group Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The WGU Connect group could not be found.
            </p>
            <Button asChild>
              <Link to="/wgu-connect">Browse All Groups</Link>
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  const getGroupTypeLabel = (type?: string) => {
    switch (type) {
      case 'course':
        return 'Course Group';
      case 'degree':
        return 'Degree Program';
      case 'general':
        return 'General Discussion';
      default:
        return 'Study Group';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getResourceIcon = (type?: string) => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'document':
        return '📄';
      case 'link':
        return '🔗';
      case 'tool':
        return '🛠️';
      default:
        return '📚';
    }
  };

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
              <Link to="/wgu-connect">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to groups</span>
              </Link>
            </Button>
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold line-clamp-1">{group.name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  {group.courseCode && (
                    <span className="text-muted-foreground">{group.courseCode}</span>
                  )}
                  {group.memberCount && (
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {group.memberCount.toLocaleString()} members
                    </p>
                  )}
                </div>
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
              {/* Group Info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    About This Group
                  </h2>
                  <div className="space-y-4">
                    {group.description && (
                      <div>
                        <h3 className="font-medium mb-2">Description</h3>
                        <p className="text-muted-foreground">{group.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-1">Type</h3>
                        <Badge variant="secondary">{getGroupTypeLabel(group.type)}</Badge>
                      </div>
                      {group.created && (
                        <div>
                          <h3 className="font-medium mb-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Created
                          </h3>
                          <p className="text-muted-foreground">{formatDate(group.created)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Resources */}
              {group.resources && group.resources.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Resources
                    </h2>
                    <div className="space-y-3">
                      {group.resources.map((resource, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{getResourceIcon(resource.type)}</span>
                            <div className="flex-1">
                              <h3 className="font-medium">{resource.title}</h3>
                              {resource.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {resource.description}
                                </p>
                              )}
                              {resource.url && (
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                                >
                                  View Resource
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Guidelines */}
              {group.guidelines && group.guidelines.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Group Guidelines
                    </h2>
                    <ul className="space-y-2">
                      {group.guidelines.map((guideline, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{guideline}</span>
                        </li>
                      ))}
                    </ul>
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
                    {group.url && (
                      <Button asChild className="w-full">
                        <a 
                          href={group.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Join Group
                        </a>
                      </Button>
                    )}
                    {group.courseCode && (
                      <Button asChild variant="outline" className="w-full">
                        <Link to={`/courses/${group.courseCode}`}>
                          View Course Details
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/suggest">
                        Suggest a Resource
                      </Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>

              {/* Related */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Find More</h3>
                  <div className="space-y-2">
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link to="/wgu-connect">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Browse All Groups
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link to="/search">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Search Resources
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
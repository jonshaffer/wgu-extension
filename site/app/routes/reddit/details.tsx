import React from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@apollo/client/index.js';
import { motion } from 'motion/react';
import { GET_REDDIT_COMMUNITY } from '~/graphql/queries';
import { Container } from '~/components/ui/container';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { 
  ArrowLeft, 
  Users,
  Calendar,
  ExternalLink,
  TrendingUp,
  MessageSquare,
  FileText
} from 'lucide-react';
import type { Route } from "./+types/details";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `r/${params.subredditName} - WGU Extension` },
    { name: "description", content: `View details for Reddit community r/${params.subredditName}` },
  ];
}

interface RedditCommunity {
  name: string;
  description?: string;
  memberCount?: number;
  url: string;
  created?: string;
  type?: string;
  rules?: Array<{
    title: string;
    description?: string;
  }>;
  moderators?: string[];
}

export default function RedditDetails() {
  const params = useParams();
  const subredditName = params.subredditName || '';

  const { data, loading, error } = useQuery(GET_REDDIT_COMMUNITY, {
    variables: { subredditName },
    skip: !subredditName
  });

  const community: RedditCommunity | undefined = data?.redditCommunity;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-background">
        <Container className="py-16">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Community Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The Reddit community r/{subredditName} could not be found.
            </p>
            <Button asChild>
              <Link to="/reddit">Browse All Communities</Link>
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  const formatMemberCount = (count?: number) => {
    if (!count) return 'Unknown';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M members`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K members`;
    }
    return `${count.toLocaleString()} members`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
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
              <Link to="/reddit">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to communities</span>
              </Link>
            </Button>
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">r/{community.name}</h1>
                {community.memberCount && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {formatMemberCount(community.memberCount)}
                  </p>
                )}
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
              {/* Community Info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    About Community
                  </h2>
                  <div className="space-y-4">
                    {community.description && (
                      <div>
                        <h3 className="font-medium mb-2">Description</h3>
                        <p className="text-muted-foreground">{community.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {community.created && (
                        <div>
                          <h3 className="font-medium mb-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Created
                          </h3>
                          <p className="text-muted-foreground">{formatDate(community.created)}</p>
                        </div>
                      )}
                      {community.type && (
                        <div>
                          <h3 className="font-medium mb-1">Type</h3>
                          <Badge variant="secondary">{community.type}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Rules */}
              {community.rules && community.rules.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Community Rules
                    </h2>
                    <div className="space-y-3">
                      {community.rules.map((rule, index) => (
                        <div key={index} className="border-l-2 border-primary/20 pl-4">
                          <h3 className="font-medium">
                            {index + 1}. {rule.title}
                          </h3>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {rule.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Moderators */}
              {community.moderators && community.moderators.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Moderators</h2>
                    <div className="flex flex-wrap gap-2">
                      {community.moderators.map((mod) => (
                        <Badge key={mod} variant="outline">
                          u/{mod}
                        </Badge>
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
                    {community.url && (
                      <Button asChild className="w-full">
                        <a 
                          href={community.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit on Reddit
                        </a>
                      </Button>
                    )}
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/suggest">
                        Report an Issue
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
                      <Link to="/reddit">
                        <Users className="h-4 w-4 mr-2" />
                        Browse All Communities
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
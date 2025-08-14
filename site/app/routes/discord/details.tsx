import React from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@apollo/client/index.js';
import { motion } from 'motion/react';
import { GET_DISCORD_SERVER } from '~/graphql/queries';
import { Container } from '~/components/ui/container';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { 
  ArrowLeft, 
  MessageCircle, 
  Users,
  Hash,
  Volume2,
  FolderOpen,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import type { Route } from "./+types/details";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Discord Server - WGU Extension` },
    { name: "description", content: `View details for Discord server` },
  ];
}

interface Channel {
  id: string;
  name: string;
  type: string;
  category?: string;
}

interface DiscordServer {
  id: string;
  name: string;
  icon?: string;
  memberCount?: number;
  description?: string;
  categories?: string[];
  channels?: Channel[];
  inviteUrl?: string;
}

export default function DiscordDetails() {
  const params = useParams();
  const serverId = params.serverId || '';

  const { data, loading, error } = useQuery(GET_DISCORD_SERVER, {
    variables: { serverId },
    skip: !serverId
  });

  const server: DiscordServer | undefined = data?.discordServer;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="min-h-screen bg-background">
        <Container className="py-16">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Server Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The Discord server could not be found.
            </p>
            <Button asChild>
              <Link to="/discord">Browse All Servers</Link>
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  const getServerIcon = () => {
    if (server.icon) {
      return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`;
    }
    return null;
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <Volume2 className="h-4 w-4" />;
      case 'category':
        return <FolderOpen className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  // Group channels by category
  const channelsByCategory = React.useMemo(() => {
    if (!server.channels) return {};
    
    const grouped: Record<string, Channel[]> = { 'Uncategorized': [] };
    
    server.channels.forEach(channel => {
      const category = channel.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      if (channel.type !== 'category') {
        grouped[category].push(channel);
      }
    });
    
    return grouped;
  }, [server.channels]);

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
              <Link to="/discord">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to servers</span>
              </Link>
            </Button>
            <div className="flex items-center gap-4 flex-1">
              {getServerIcon() ? (
                <img 
                  src={getServerIcon()!} 
                  alt={server.name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{server.name}</h1>
                {server.memberCount && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {server.memberCount.toLocaleString()} members
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
              {/* Server Info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Server Information
                  </h2>
                  <div className="space-y-4">
                    {server.description && (
                      <div>
                        <h3 className="font-medium mb-2">Description</h3>
                        <p className="text-muted-foreground">{server.description}</p>
                      </div>
                    )}
                    {server.categories && server.categories.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Categories</h3>
                        <div className="flex flex-wrap gap-2">
                          {server.categories.map((category) => (
                            <Badge key={category} variant="secondary">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Channels */}
              {server.channels && server.channels.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Channels
                    </h2>
                    <div className="space-y-4">
                      {Object.entries(channelsByCategory).map(([category, channels]) => (
                        channels.length > 0 && (
                          <div key={category}>
                            <h3 className="font-medium text-sm text-muted-foreground mb-2 uppercase">
                              {category}
                            </h3>
                            <div className="space-y-1">
                              {channels.map((channel) => (
                                <div
                                  key={channel.id}
                                  className="flex items-center gap-2 py-1 px-2 rounded hover:bg-accent"
                                >
                                  {getChannelIcon(channel.type)}
                                  <span className="text-sm">{channel.name}</span>
                                  {channel.type === 'voice' && (
                                    <Badge variant="outline" className="text-xs ml-auto">
                                      Voice
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
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
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    {server.inviteUrl && (
                      <Button asChild className="w-full">
                        <a 
                          href={server.inviteUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Join Server
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
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Find More</h3>
                  <div className="space-y-2">
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link to="/discord">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Browse All Servers
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start">
                      <Link to="/search">
                        <Hash className="h-4 w-4 mr-2" />
                        Search Communities
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
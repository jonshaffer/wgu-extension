import React from 'react';
import type { Route } from "./+types/home";
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import Spotlight from "../components/Spotlight";
import SearchResults from "../components/SearchResults";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { Logo } from "../components/Logo";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { Plus, BookOpen, MessageCircle, Users, GraduationCap } from 'lucide-react';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Unofficial WGU Extension - Community Resources" },
    { name: "description", content: "Find and search WGU community resources, study groups, and discussions" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchResults = (results: any[], isLoading: boolean, queriedFor?: string, error?: Error | null) => {
    // When user starts searching, navigate to search page
    if (searchQuery) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <>
      <Navigation />
      {/* Hero Section (https://www.shadcnblocks.com/block/hero12) */}
      <section className="relative overflow-hidden py-16">
        <motion.div 
          className="absolute inset-x-0 top-0 flex h-full w-full items-center justify-center opacity-100"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <img 
            alt="background" 
            src="/images/hero-bg-light.svg" 
            className="w-full h-full object-cover dark:hidden mask-radial-from-60% mask-radial-to-[rgba(0,0,0,0)]"
          />
          <img 
            alt="background" 
            src="/images/hero-bg-dark.svg" 
            className="w-full h-full object-cover hidden dark:block mask-radial-from-60% mask-radial-to-[rgba(0,0,0,0)]"
          />
        </motion.div>
        <div className="relative z-10">
          <Container size="sm" className="flex flex-col items-center">
            <div className="flex flex-col items-center gap-6 text-center">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <Card className="border-none bg-background/30 p-4 shadow-sm backdrop-blur-sm">
                  <div className="inline-flex items-center justify-center bg-muted rounded-lg p-3">
                    <img src="/images/wgu-extension-logo.png" alt="WGU Extension logo" className="h-16" />
                  </div>
                </Card>
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
              >
                <h1 className="mb-6 text-2xl font-bold tracking-tight text-pretty lg:text-5xl">
                  Find WGU Community <span className="text-primary">Resources</span>
                </h1>
                <p className="mx-auto max-w-3xl text-muted-foreground lg:text-xl">
                  Search across Discord servers, Reddit communities, and study groups to find the resources you need for your WGU journey.
                </p>
              </motion.div>
              <motion.div 
                className="mt-6 w-full max-w-2xl"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <Spotlight 
                  onSearch={handleSearchResults} 
                  onQueryChange={handleQueryChange}
                />
              </motion.div>
                
                {/* Browse Links */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  className="mt-8 flex flex-wrap items-center justify-center gap-4"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/courses')}
                    className="gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Courses
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/degree-plans')}
                    className="gap-2"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Degree Plans
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/discord')}
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Discord Servers
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/reddit')}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Reddit Communities
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/wgu-connect')}
                    className="gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    WGU Connect
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/student-groups')}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Student Groups
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/suggest')}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Suggest a Resource
                  </Button>
                </motion.div>
              <div className="mt-20 flex flex-col items-center gap-5">
                <p className="font-medium text-muted-foreground lg:text-left">Powered by the WGU student community</p>
                <motion.div 
                  className="flex flex-wrap items-center justify-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm font-medium">
                      Discord Servers
                      <span className="text-xs font-bold">2</span>
                    </Badge>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm font-medium">
                      Reddit Communities
                      <span className="text-xs font-bold">2</span>
                    </Badge>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                  >
                    <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm font-medium">
                      Student Groups
                      <span className="text-xs font-bold">12</span>
                    </Badge>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                  >
                    <Badge variant="secondary" className="gap-2 px-4 pb-0 py-2 text-sm font-medium">
                      Courses
                      <span className="text-xs font-bold">829</span>
                    </Badge>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.3 }}
                  >
                    <Badge variant="secondary" className="gap-2 px-4 pt-0 py-2 text-sm font-medium">
                      Degree Plans
                      <span className="text-xs font-bold">180</span>
                    </Badge>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* Features Section with Cream Background */}
      <section className="py-16 bg-muted">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why Use WGU Extension?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with thousands of WGU students across Discord, Reddit, and official study groups
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="h-full text-center p-6">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Active Communities</h3>
                <p className="text-sm text-muted-foreground">
                  Join course-specific Discord servers with thousands of active students
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="h-full text-center p-6">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Study Resources</h3>
                <p className="text-sm text-muted-foreground">
                  Access curated study materials and tips from successful students
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="h-full text-center p-6">
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Student Support</h3>
                <p className="text-sm text-muted-foreground">
                  Get help from peers who've completed the courses you're taking
                </p>
              </Card>
            </motion.div>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}

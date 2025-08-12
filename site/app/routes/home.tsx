import React from 'react';
import type { Route } from "./+types/home";
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import Spotlight from "../components/Spotlight";
import SearchResults from "../components/SearchResults";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Container } from "~/components/ui/container";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "WGU Extension - Community Resources" },
    { name: "description", content: "Find and search WGU community resources, study groups, and discussions" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchResults = (results: any[], isLoading: boolean) => {
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
      {/* Hero Section (https://www.shadcnblocks.com/block/hero12) */}
      <section className="relative overflow-hidden py-32">
        <motion.div 
          className="absolute inset-x-0 top-0 flex h-full w-full items-center justify-center opacity-100"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <img 
            alt="background" 
            src="/images/block/patterns/square-alt-grid.svg" 
            className="[mask-image:radial-gradient(75%_75%_at_center,white,transparent)] opacity-90"
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
                  <img src="/images/wgu-extension-logo.svg" alt="WGU Extension logo" className="h-16" />
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
                    <Badge variant="secondary" className="gap-2 bg-background/50 px-4 py-2 text-sm font-medium">
                      Discord Servers
                      <span className="text-xs opacity-70">50+</span>
                    </Badge>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <Badge variant="secondary" className="gap-2 bg-background/50 px-4 py-2 text-sm font-medium">
                      Reddit Communities
                      <span className="text-xs opacity-70">25+</span>
                    </Badge>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                  >
                    <Badge variant="secondary" className="gap-2 bg-background/50 px-4 py-2 text-sm font-medium">
                      Study Groups
                      <span className="text-xs opacity-70">100+</span>
                    </Badge>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* Remove search results section as we'll navigate to search page */}
    </>
  );
}

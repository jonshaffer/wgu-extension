import React from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import type { Route } from "./+types/search";
import { motion, AnimatePresence } from 'motion/react';
import Spotlight from "../components/Spotlight";
import SearchResults from "../components/SearchResults";
import { Container } from "~/components/ui/container";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from 'lucide-react';

export function meta({ location }: Route.MetaArgs) {
  const params = new URLSearchParams(location.search);
  const query = params.get('q') || '';
  
  return [
    { title: query ? `Search: ${query} - WGU Extension` : "Search - WGU Extension" },
    { name: "description", content: "Search WGU community resources, Discord servers, and study groups" },
  ];
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  const handleSearchResults = (results: any[], isLoading: boolean) => {
    setSearchResults(results);
    setLoading(isLoading);
    if (!isLoading) {
      setHasSearched(true);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Update URL when search query changes
  const updateSearchQuery = (newQuery: string) => {
    if (newQuery) {
      setSearchParams({ q: newQuery });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <Container className="py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to home</span>
            </Button>
            <div className="flex-1">
              <Spotlight 
                onSearch={handleSearchResults}
                initialQuery={query}
                onQueryChange={updateSearchQuery}
              />
            </div>
          </div>
        </Container>
      </motion.header>

      {/* Search Results */}
      <main className="py-8">
        <Container>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="mt-4 text-muted-foreground">Searching...</p>
              </motion.div>
            )}

            {!loading && hasSearched && searchResults.length === 0 && (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center py-16"
              >
                <h2 className="text-2xl font-semibold mb-2">No results found</h2>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or browse our categories
                </p>
              </motion.div>
            )}

            {!loading && searchResults.length > 0 && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-bold">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{query}"
                  </h1>
                </div>
                <SearchResults results={searchResults} loading={false} />
              </motion.div>
            )}

            {!loading && !hasSearched && query && (
              <motion.div
                key="initial-search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <p className="text-muted-foreground">Press enter to search for "{query}"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </main>
    </div>
  );
}
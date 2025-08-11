import React from 'react';
import type { Route } from "./+types/home";
import Spotlight from "../../components/Spotlight";
import SearchResults from "../../components/SearchResults";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasInteracted, setHasInteracted] = React.useState(false);

  const handleSearchResults = (results: any[], isLoading: boolean) => {
    setSearchResults(results);
    setLoading(isLoading);
    setHasInteracted(true);
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-md flex flex-col gap-4">
        <Spotlight onSearch={handleSearchResults} />
        {hasInteracted && (searchResults.length > 0 || loading) && (<SearchResults results={searchResults} loading={loading} />)}
      </div>
    </div>
  );
}

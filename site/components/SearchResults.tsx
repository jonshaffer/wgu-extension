import React from 'react';

interface SearchResultsProps {
  results: any[]; // Replace 'any[]' with a more specific type for your search results
  loading: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, loading }) => {
  if (loading) {
    return <div className="mt-4 text-center">Loading...</div>;
  }

  if (!results || results.length === 0) {
    return null; // Or a "No results found" message
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
      <ul>
        {results.map((result, index) => (
          <li key={index} className="border-b border-gray-200 py-2">
            {/* Render your search result item here */}
            {/* Replace with actual rendering based on your result structure */}
            <p>{JSON.stringify(result)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchResults;
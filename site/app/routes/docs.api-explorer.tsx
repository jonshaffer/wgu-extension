import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import { useState, useEffect } from 'react';
import type { Route } from './+types/docs.api-explorer';
import 'graphiql/graphiql.css';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'API Explorer | Unofficial WGU Extension Docs' },
    { name: 'description', content: 'Explore the Unofficial WGU Extension GraphQL API' },
  ];
}

const defaultQuery = `# Welcome to the Unofficial WGU Extension API Explorer
# 
# Use this tool to explore the available queries and mutations
# in the Unofficial WGU Extension GraphQL API.
#
# Example queries:

# Get courses with pagination
query GetCourses {
  courses(limit: 10, offset: 0) {
    items {
      courseCode
      name
      description
      units
      level
    }
    totalCount
  }
}

# Search for communities
# query SearchCommunities {
#   search(query: "C779", limit: 10) {
#     results {
#       type
#       id
#       title
#       description
#       url
#       courseCode
#     }
#     totalCount
#   }
# }

# Get degree plans
# query GetDegreePlans {
#   degreePlans(limit: 5) {
#     items {
#       id
#       name
#       description
#       totalCUs
#       courses
#     }
#     totalCount
#   }
# }
`;

// Pre-defined example queries
const exampleQueries = {
  courses: `# Get all courses with pagination
query GetCourses {
  courses(limit: 10, offset: 0) {
    items {
      courseCode
      name
      description
      units
      level
    }
    totalCount
  }
}`,
  search: `# Search for communities by course code
query SearchCommunities {
  search(query: "C779", limit: 10) {
    results {
      type
      id
      title
      description
      url
      courseCode
      memberCount
      platform
    }
    totalCount
  }
}`,
  degreePlans: `# Get degree plans with course lists
query GetDegreePlans {
  degreePlans(limit: 5, offset: 0) {
    items {
      id
      name
      description
      totalCUs
      courses
    }
    totalCount
  }
}`,
  allData: `# Get all data types at once
query GetAllDataTypes {
  # Courses
  courses(limit: 5) {
    items {
      courseCode
      name
    }
  }
  
  # Community search
  search(query: "", limit: 5) {
    results {
      type
      title
      platform
    }
  }
  
  # Degree plans
  degreePlans(limit: 3) {
    items {
      name
      totalCUs
    }
  }
}`
};

export default function GraphQLExplorer() {
  const [query, setQuery] = useState<string>(() => {
    // Try to load saved query from localStorage
    if (typeof window !== 'undefined') {
      const savedQuery = localStorage.getItem('wgu-graphql-query');
      return savedQuery || defaultQuery;
    }
    return defaultQuery;
  });
  
  const graphQLEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT || 
    'https://us-central1-wgu-extension.cloudfunctions.net/graphql/graphql';

  const fetcher = createGraphiQLFetcher({
    url: graphQLEndpoint,
  });

  // Save query to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wgu-graphql-query', query);
    }
  }, [query]);

  const handleExampleClick = (exampleKey: keyof typeof exampleQueries) => {
    setQuery(exampleQueries[exampleKey]);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                API Explorer
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Interactive API explorer for the Unofficial WGU Extension GraphQL endpoint
              </p>
            </div>
            <a
              href="/docs/api"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to API Docs
            </a>
          </div>
          
          {/* Example queries buttons */}
          <div className="pb-4 flex gap-2 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">Quick examples:</span>
            <button
              onClick={() => handleExampleClick('courses')}
              className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              Courses
            </button>
            <button
              onClick={() => handleExampleClick('search')}
              className="text-sm px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              Search Communities
            </button>
            <button
              onClick={() => handleExampleClick('degreePlans')}
              className="text-sm px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              Degree Plans
            </button>
            <button
              onClick={() => handleExampleClick('allData')}
              className="text-sm px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
            >
              All Data Types
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden graphiql-container">
        <GraphiQL 
          fetcher={fetcher} 
          query={query}
          onEditQuery={setQuery}
          defaultEditorToolsVisibility={true}
          shouldPersistHeaders={true}
        />
      </div>
      
      <style>{`
        .graphiql-container {
          height: 100%;
        }
        .graphiql-container .graphiql-container {
          height: 100%;
        }
        
        /* Custom dark mode support for GraphiQL */
        .dark .graphiql-container {
          --color-base: #1f2937;
          --color-primary: 40, 80%;
          --color-secondary: 340, 80%;
          --color-tertiary: 280, 80%;
          --color-info: 200, 80%;
          --color-success: 160, 80%;
          --color-warning: 40, 80%;
          --color-error: 0, 80%;
          --color-neutral: 219, 28%;
          --alpha-secondary: 0.76;
          --alpha-tertiary: 0.5;
          --alpha-background-light: 0.02;
          --alpha-background-medium: 0.06;
          --alpha-background-heavy: 0.15;
        }
      `}</style>
    </div>
  );
}
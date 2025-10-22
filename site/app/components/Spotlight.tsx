import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Search, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { debounce } from 'lodash';
import { useLazyQuery } from '@apollo/client/index.js';
import { SEARCH, ADVANCED_SEARCH } from '~/graphql/queries';
import { parseSearchQuery, toGraphQLVariables } from '~/lib/search-parser';

const formSchema = z.object({
  query: z.string(), // Allow empty string initially
});
interface SpotlightProps {
  onSearch: (results: any[], loading: boolean, queriedFor?: string, error?: Error | null) => void;
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
  autoFocus?: boolean;
}

const Spotlight: React.FC<SpotlightProps> = ({ onSearch, initialQuery = '', onQueryChange, autoFocus = false }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: initialQuery,
    },
  });

  const currentSearchQueryRef = React.useRef<string>(initialQuery);

  // Use basic search for simple queries
  const [searchQuery, { loading: basicLoading }] = useLazyQuery(SEARCH, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.search) {
        onSearch(data.search.results, false, currentSearchQueryRef.current, null);
      }
    },
    onError: (error) => {
      console.error('GraphQL search error:', error);
      onSearch([], false, currentSearchQueryRef.current, error);
    },
  });

  // Use advanced search for queries with operators
  const [advancedSearchQuery, { loading: advancedLoading }] = useLazyQuery(ADVANCED_SEARCH, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.advancedSearch) {
        onSearch(data.advancedSearch.results, false, currentSearchQueryRef.current, null);
      }
    },
    onError: (error) => {
      console.error('GraphQL advanced search error:', error);
      onSearch([], false, currentSearchQueryRef.current, error);
    },
  });

  const loading = basicLoading || advancedLoading;

  const performSearch = (query: string) => {
    if (query) {
      currentSearchQueryRef.current = query; // Store the query being searched
      onSearch([], true, query, null); // Call onSearch with loading: true
      
      // Parse the query to check if it has advanced operators
      const parsed = parseSearchQuery(query);
      
      // If we have filters or it's a complex query, use advanced search
      if (parsed.filters.length > 0) {
        const variables = toGraphQLVariables(parsed);
        advancedSearchQuery({
          variables: {
            ...variables,
            limit: 20,
          },
        });
      } else {
        // Otherwise use basic search
        searchQuery({
          variables: {
            query,
            limit: 20,
          },
        });
      }
    } else {
      onSearch([], false, '', null); // Call onSearch with empty results and loading: false if query is empty
    }
  };

  const debouncedSearch = React.useCallback(
    debounce(performSearch, 300),
    [searchQuery, onSearch]
  );

  const handleSubmit = form.handleSubmit((data) => {
    performSearch(data.query);
  });

  React.useEffect(() => {
    // Call the function using the callable reference
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Perform initial search if query provided
  React.useEffect(() => {
    if (initialQuery) {
      currentSearchQueryRef.current = initialQuery; // Set the ref before searching
      performSearch(initialQuery);
    }
  }, []); // Only run once on mount
  return (
    <Form {...form}>
      <motion.form 
        onSubmit={handleSubmit} 
        className='relative flex gap-2'
        layoutId="search-form"
        layout
      >
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Find Discord servers, Reddit communities, study groups..."
                    className="h-12 pl-10 pr-12 text-base shadow-lg border-input/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      debouncedSearch(e.target.value);
                      onQueryChange?.(e.target.value);
                    }}
                    autoFocus={autoFocus}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <div className="space-y-2 text-sm">
                          <p className="font-semibold">Advanced Search Tips:</p>
                          <ul className="space-y-1 text-xs">
                            <li><code>type:course</code> - Search only courses</li>
                            <li><code>platform:discord</code> - Search Discord servers</li>
                            <li><code>level:upper</code> - Upper-level courses</li>
                            <li><code>members:&gt;500</code> - Communities with 500+ members</li>
                            <li><code>code:C779</code> - Search by course code</li>
                            <li><code>college:IT</code> - Filter by college</li>
                            <li><code>"exact phrase"</code> - Search exact phrases</li>
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          size="lg" 
          className="h-12 px-8 shadow-lg"
          disabled={loading || !form.watch('query')}
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </Button>
      </motion.form>
    </Form>
  );
};

export default Spotlight;
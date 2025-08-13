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
import { Search } from 'lucide-react';
import { debounce } from 'lodash';
import { useLazyQuery } from '@apollo/client/index.js';
import { SEARCH } from '~/graphql/queries';

const formSchema = z.object({
  query: z.string(), // Allow empty string initially
});
interface SpotlightProps {
  onSearch: (results: any[], loading: boolean, queriedFor?: string) => void;
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

  const [searchQuery, { loading }] = useLazyQuery(SEARCH, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.search) {
        onSearch(data.search.results, false, currentSearchQueryRef.current);
      }
    },
    onError: (error) => {
      console.error('GraphQL search error:', error);
      onSearch([], false, currentSearchQueryRef.current);
    },
  });

  const performSearch = (query: string) => {
    if (query) {
      currentSearchQueryRef.current = query; // Store the query being searched
      onSearch([], true); // Call onSearch with loading: true
      searchQuery({
        variables: {
          query,
          limit: 20,
        },
      });
    } else {
      onSearch([], false); // Call onSearch with empty results and loading: false if query is empty
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
                    placeholder="Search Discord servers, Reddit communities, study groups..."
                    className="h-12 pl-10 pr-4 text-base shadow-lg border-input/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      debouncedSearch(e.target.value);
                      onQueryChange?.(e.target.value);
                    }}
                    autoFocus={autoFocus}
                  />
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
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

import { getFunctions, httpsCallable } from 'firebase/functions'; // Import functions and httpsCallable
import { app } from '../lib/firebase'; // Import your Firebase app instance

const formSchema = z.object({
  query: z.string(), // Allow empty string initially
});
interface SpotlightProps {
  onSearch: (results: any[], loading: boolean) => void;
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

  const functions = getFunctions(app); // Get functions instance
  const searchCallable = httpsCallable(functions, 'search'); // Create callable function reference
  const [isSearching, setIsSearching] = React.useState(false);

  const performSearch = async (query: string) => {
    if (query) {
      setIsSearching(true);
      onSearch([], true); // Call onSearch with loading: true
      try {
        const result = await searchCallable({ query });
        // Type assertion for result.data
        const data = result.data as { results?: any[] };
        onSearch(data.results || [], false); // Call onSearch with results and loading: false
        console.log('Search results:', result.data);
      } catch (error) {
        console.error('Error searching:', error);
        onSearch([], false); // Call onSearch with empty results and loading: false on error
      } finally {
        setIsSearching(false);
      }
    } else {
      onSearch([], false); // Call onSearch with empty results and loading: false if query is empty
    }
  };

  const debouncedSearch = React.useCallback(
    debounce(performSearch, 300),
    [searchCallable, onSearch] // Add onSearch to dependency array
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
          disabled={isSearching || !form.watch('query')}
        >
          {isSearching ? (
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
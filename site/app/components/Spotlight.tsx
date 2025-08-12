import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { debounce } from 'lodash';

import { getFunctions, httpsCallable } from 'firebase/functions'; // Import functions and httpsCallable
import { app } from '../lib/firebase'; // Import your Firebase app instance

const formSchema = z.object({
  query: z.string(), // Allow empty string initially
});
interface SpotlightProps {
  onSearch: (results: any[], loading: boolean) => void;
}

const Spotlight: React.FC<SpotlightProps> = ({ onSearch }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
    },
  });

  const functions = getFunctions(app); // Get functions instance
  const searchFirestoreCallable = httpsCallable(functions, 'searchFirestore'); // Create callable function reference
  const debouncedSearch = React.useCallback(
    debounce(async (query: string) => {
      if (query) {
        onSearch([], true); // Call onSearch with loading: true
        try {
          const result = await searchFirestoreCallable({ query });
          // Type assertion for result.data
          const data = result.data as { results?: any[] };
          onSearch(data.results || [], false); // Call onSearch with results and loading: false
          console.log('Search results:', result.data);
        } catch (error) {
          console.error('Error searching:', error);
          onSearch([], false); // Call onSearch with empty results and loading: false on error
        }
      } else {
        onSearch([], false); // Call onSearch with empty results and loading: false if query is empty
      }
    }, 300),
    [searchFirestoreCallable, onSearch] // Add onSearch to dependency array
  );

  React.useEffect(() => {
      // Call the function using the callable reference
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);
  return (
    <Form {...form}>
      <form className='flex gap-2'>
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Search..."
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    debouncedSearch(e.target.value);
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default Spotlight;
import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, MessageCircle, Users, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';

interface SearchResult {
  type: string;
  courseCode?: string | null;
  name: string;
  url: string | null;
  description?: string | null;
  icon?: string | null;
  platform: string;
  memberCount?: number | null;
  competencyUnits?: number | null;
  college?: string | null;
  degreeType?: string | null;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
}

const platformIcons: Record<string, React.ReactNode> = {
  discord: <MessageCircle className="h-4 w-4" />,
  reddit: <Users className="h-4 w-4" />,
  wguConnect: <BookOpen className="h-4 w-4" />,
  'wgu-student-groups': <Users className="h-4 w-4" />,
  'academic-registry': <BookOpen className="h-4 w-4" />,
};

const platformLabels: Record<string, string> = {
  discord: 'Discord',
  reddit: 'Reddit',
  wguConnect: 'WGU Connect',
  'wgu-student-groups': 'WGU Student Groups',
  'academic-registry': 'WGU Catalog',
};

const SearchResults: React.FC<SearchResultsProps> = ({ results, loading }) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {results.map((result, index) => (
        <motion.div
          key={`${result.platform}-${result.url}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base line-clamp-2 flex-1">
                  {result.name}
                </CardTitle>
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={`Open ${result.name} in new tab`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {platformIcons[result.platform]}
                  {platformLabels[result.platform] || result.platform}
                </Badge>
                
                {result.courseCode && (
                  <Badge variant="outline">{result.courseCode}</Badge>
                )}
                
                {result.type === 'university' && (
                  <Badge variant="default">University-wide</Badge>
                )}
                
                {result.type === 'degree' && (
                  <Badge variant="default">{result.degreeType}</Badge>
                )}
                
                {result.competencyUnits && result.type === 'course' && (
                  <Badge variant="secondary">{result.competencyUnits} CUs</Badge>
                )}
              </div>
              
              {result.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {result.description}
                </p>
              )}
              
              {result.memberCount && (
                <p className="text-xs text-muted-foreground">
                  {result.memberCount.toLocaleString()} members
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default SearchResults;
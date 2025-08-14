import React from 'react';
import { useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '~/lib/auth';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Filter,
  Search,
  RefreshCw,
  Eye,
  MessageSquare
} from 'lucide-react';
import type { Route } from "./+types/suggestions";

interface Suggestion {
  id: string;
  type: 'community_suggestion' | 'extension_update';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  submittedBy: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approved?: boolean;
  reviewNotes?: string;
  
  // Community suggestion fields
  communityType?: 'discord' | 'reddit' | 'student_group' | 'wgu_connect';
  name?: string;
  url?: string;
  description?: string;
  courseCode?: string;
  college?: string;
  memberCount?: number;
  submitterName?: string;
  submitterEmail?: string;
  
  // Extension update fields
  source?: 'wgu_connect' | 'discord_channel' | 'student_group';
  groupId?: string;
  channelId?: string;
  serverId?: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Suggestions Review - WGU Extension Admin" },
    { name: "robots", content: "noindex, nofollow" }
  ];
}

export default function SuggestionsReview() {
  const { getAuthToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  
  // Filters
  const currentStatus = searchParams.get('status') || 'pending';
  const currentType = searchParams.get('type') || '';
  const currentSearch = searchParams.get('search') || '';
  
  // Pagination
  const [pagination, setPagination] = React.useState({
    offset: 0,
    limit: 20,
    total: 0,
    hasMore: false
  });
  
  // Review modal
  const [reviewingSuggestion, setReviewingSuggestion] = React.useState<Suggestion | null>(null);
  const [reviewNotes, setReviewNotes] = React.useState('');

  const fetchSuggestions = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication token not available');
        return;
      }
      
      const params = new URLSearchParams({
        status: currentStatus,
        offset: String(pagination.offset),
        limit: String(pagination.limit)
      });
      
      if (currentType) params.set('type', currentType);
      if (currentSearch) params.set('search', currentSearch);
      
      const functionsUrl = import.meta.env.DEV 
        ? 'http://localhost:5001/wgu-extension-site-prod/us-central1'
        : 'https://us-central1-wgu-extension-site-prod.cloudfunctions.net';
        
      const response = await fetch(`${functionsUrl}/suggestionsAdmin?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        hasMore: data.pagination?.hasMore || false
      }));
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch suggestions';
      setError(errorMessage);
      console.error('Error fetching suggestions:', error);
      
      // Show toast notification in development
      if (import.meta.env.DEV) {
        toast.error('Failed to Load Suggestions', {
          description: errorMessage,
          action: {
            label: 'Retry',
            onClick: () => fetchSuggestions()
          }
        });
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, currentStatus, currentType, currentSearch, pagination.offset, pagination.limit]);

  React.useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleReviewAction = async (suggestionId: string, action: 'approve' | 'reject' | 'pending') => {
    try {
      setActionLoading(suggestionId);
      
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication token not available');
        return;
      }
      
      const functionsUrl = import.meta.env.DEV 
        ? 'http://localhost:5001/wgu-extension-site-prod/us-central1'
        : 'https://us-central1-wgu-extension-site-prod.cloudfunctions.net';
      
      const response = await fetch(`${functionsUrl}/suggestionsAdmin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          suggestionId,
          action,
          reviewNotes: reviewNotes || undefined
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Refresh the list
      await fetchSuggestions();
      
      // Close review modal
      setReviewingSuggestion(null);
      setReviewNotes('');
      
      // Show success toast in development
      if (import.meta.env.DEV) {
        toast.success(`Suggestion ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Reset'}`, {
          description: `Suggestion has been ${action === 'pending' ? 'reset to pending' : action + 'd'}.`
        });
      }
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update suggestion';
      setError(errorMessage);
      console.error('Error updating suggestion:', error);
      
      // Show error toast in development
      if (import.meta.env.DEV) {
        toast.error('Failed to Update Suggestion', {
          description: errorMessage,
          action: {
            label: 'Retry',
            onClick: () => handleReviewAction(suggestionId, action)
          }
        });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset pagination when changing filters
    newParams.delete('offset');
    setSearchParams(newParams);
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeDisplay = (suggestion: Suggestion) => {
    if (suggestion.type === 'community_suggestion') {
      return `Community: ${suggestion.communityType}`;
    } else if (suggestion.type === 'extension_update') {
      return `Extension: ${suggestion.source}`;
    }
    return suggestion.type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Suggestions Review</h1>
          <p className="text-muted-foreground mt-1">
            Review and moderate community suggestions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchSuggestions}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label htmlFor="status-filter">Status:</Label>
              <select
                id="status-filter"
                value={currentStatus}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="px-3 py-1 border border-input rounded-md text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="type-filter">Type:</Label>
              <select
                id="type-filter"
                value={currentType}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="px-3 py-1 border border-input rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="community_suggestion">Community Suggestions</option>
                <option value="extension_update">Extension Updates</option>
              </select>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search suggestions..."
                value={currentSearch}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-destructive/10 border border-destructive/20"
        >
          <p className="text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Suggestions List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No suggestions found for the current filters.
            </p>
          </Card>
        ) : (
          <AnimatePresence>
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(suggestion.status)}
                        <Badge variant="outline">
                          {getTypeDisplay(suggestion)}
                        </Badge>
                        {suggestion.courseCode && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {suggestion.courseCode}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold">
                          {suggestion.name || `${suggestion.type} - ${suggestion.id.slice(-8)}`}
                        </h3>
                        {suggestion.description && (
                          <p className="text-muted-foreground mt-1 line-clamp-2">
                            {suggestion.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Submitted: {new Date(suggestion.submittedAt).toLocaleDateString()}
                        </span>
                        <span>
                          By: {suggestion.submittedBy}
                        </span>
                        {suggestion.url && (
                          <a
                            href={suggestion.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Link
                          </a>
                        )}
                      </div>

                      {suggestion.reviewedAt && (
                        <div className="text-sm text-muted-foreground">
                          <span>
                            Reviewed by {suggestion.reviewedBy} on{' '}
                            {new Date(suggestion.reviewedAt).toLocaleDateString()}
                          </span>
                          {suggestion.reviewNotes && (
                            <p className="mt-1 italic">"{suggestion.reviewNotes}"</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewingSuggestion(suggestion)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>

                      {suggestion.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleReviewAction(suggestion.id, 'approve')}
                            disabled={actionLoading === suggestion.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading === suggestion.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReviewAction(suggestion.id, 'reject')}
                            disabled={actionLoading === suggestion.id}
                          >
                            {actionLoading === suggestion.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingSuggestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setReviewingSuggestion(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Review Suggestion</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReviewingSuggestion(null)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Type</Label>
                      <p className="text-sm">{getTypeDisplay(reviewingSuggestion)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">
                        {getStatusBadge(reviewingSuggestion.status)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm">{reviewingSuggestion.name || 'N/A'}</p>
                  </div>

                  {reviewingSuggestion.description && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm whitespace-pre-wrap">{reviewingSuggestion.description}</p>
                    </div>
                  )}

                  {reviewingSuggestion.url && (
                    <div>
                      <Label className="text-sm font-medium">URL</Label>
                      <div className="flex items-center gap-2">
                        <a
                          href={reviewingSuggestion.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {reviewingSuggestion.url}
                        </a>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Submitted By</Label>
                      <p className="text-sm">{reviewingSuggestion.submittedBy}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Submitted At</Label>
                      <p className="text-sm">
                        {new Date(reviewingSuggestion.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Review Notes */}
                  <div>
                    <Label htmlFor="review-notes" className="text-sm font-medium">
                      Review Notes
                    </Label>
                    <textarea
                      id="review-notes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about your review decision..."
                      className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setReviewingSuggestion(null)}
                  >
                    Cancel
                  </Button>
                  {reviewingSuggestion.status === 'pending' && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => handleReviewAction(reviewingSuggestion.id, 'reject')}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === reviewingSuggestion.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleReviewAction(reviewingSuggestion.id, 'approve')}
                        disabled={!!actionLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading === reviewingSuggestion.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Approve
                      </Button>
                    </>
                  )}
                  {reviewingSuggestion.status !== 'pending' && (
                    <Button
                      variant="outline"
                      onClick={() => handleReviewAction(reviewingSuggestion.id, 'pending')}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === reviewingSuggestion.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      ) : (
                        <Clock className="h-4 w-4 mr-2" />
                      )}
                      Reset to Pending
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
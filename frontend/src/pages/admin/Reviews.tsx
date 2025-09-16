import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/apiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Star,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Search,
  Eye,
  Trash2
} from 'lucide-react';

interface AdminReviewRow {
  id: string;
  rating: number;
  comment: string;
  date: string;
  customer: string;
  worker: string;
  service: string;
}

const AdminReviews = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminReviewRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<AdminReviewRow | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, per_page: pageSize };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filterRating !== 'all') params.rating = filterRating;
      const { data, error } = await apiClient.get('/admin/reviews', params);
      if (error) {
        console.error('Admin reviews fetch error:', error);
        setRows([]);
        setTotalCount(0);
        return;
      }
      const reviews = (data?.reviews || []) as AdminReviewRow[];
      setRows(reviews);
      setTotalCount(Number(data?.totalCount || reviews.length));
    } catch (e) {
      console.error('Admin reviews unexpected error:', e);
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, filterRating]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchReviews();
  };

  const openView = (review: AdminReviewRow) => {
    setSelectedReview(review);
    setViewModalOpen(true);
  };

  const deleteReview = async (review: AdminReviewRow) => {
    try {
      const { error } = await apiClient.delete(`/admin/reviews/${review.id}`);
      if (error) {
        toast({ title: 'Delete failed', description: 'Unable to delete review.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Deleted', description: 'Review removed successfully.' });
      fetchReviews();
    } catch (e) {
      toast({ title: 'Delete failed', description: 'Unexpected error.', variant: 'destructive' });
    }
  };

  const reviewColumns = useMemo(() => ([
    { 
      key: 'customer', 
      label: 'Customer',
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium">{value || 'Customer'}</p>
          <p className="text-xs text-muted-foreground">{new Date(row.date).toLocaleDateString()}</p>
        </div>
      )
    },
    { key: 'worker', label: 'Worker' },
    { 
      key: 'rating', 
      label: 'Rating',
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={`h-4 w-4 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
          ))}
          <span className="ml-2 font-medium">{value}</span>
        </div>
      )
    },
    { 
      key: 'comment', 
      label: 'Review',
      render: (value: string) => (
        <div className="max-w-xs">
          <p className="text-sm truncate">{value || 'No comment'}</p>
        </div>
      )
    }
  ]), []);

  const totalReviews = totalCount;
  const averageRating = rows.length > 0 ? rows.reduce((sum, r) => sum + (r.rating || 0), 0) / rows.length : 0;
  const highRatings = rows.filter(r => r.rating >= 4).length;
  const lowRatings = rows.filter(r => r.rating <= 2).length;

  if (loading) {
    return (
      <DashboardLayout userType="admin" title="Review Management">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reviews...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin" title="Review Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Review Management</h1>
            <p className="text-muted-foreground">Monitor customer feedback and worker performance</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReviews}</div>
              <p className="text-xs text-muted-foreground">Customer feedback</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating (page)</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">On current page</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Ratings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{highRatings}</div>
              <p className="text-xs text-muted-foreground">4+ star reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Ratings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lowRatings}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3">
                <Select value={filterRating} onValueChange={(v) => { setFilterRating(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} variant="secondary">Apply</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <DataTable
          title={`Reviews (${totalCount})`}
          columns={reviewColumns}
          data={rows}
          onView={(review) => openView(review)}
          onDelete={(review) => deleteReview(review as AdminReviewRow)}
        />

        {/* View Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
            </DialogHeader>
            {selectedReview && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Customer</span>
                  <span className="font-medium">{selectedReview.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Worker</span>
                  <span className="font-medium">{selectedReview.worker}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Service</span>
                  <span className="font-medium">{selectedReview.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <span className="font-medium">{selectedReview.rating}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Comment</span>
                  <p className="mt-1">{selectedReview.comment || 'No comment'}</p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="destructive" onClick={() => { if (selectedReview) deleteReview(selectedReview); setViewModalOpen(false); }}>Delete</Button>
                  <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminReviews;
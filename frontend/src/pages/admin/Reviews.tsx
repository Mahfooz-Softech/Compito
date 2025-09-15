import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminData } from '@/hooks/useAdminData';
import { 
  Star, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';

const AdminReviews = () => {
  const { loading, allReviews } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');

  // Filter reviews based on search term and rating
  const filteredReviews = allReviews.filter(review => {
    const matchesSearch = !searchTerm || 
      review.reviewer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.worker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = filterRating === 'all' || 
      (filterRating === 'high' && review.rating >= 4) ||
      (filterRating === 'medium' && review.rating === 3) ||
      (filterRating === 'low' && review.rating <= 2);
    
    return matchesSearch && matchesRating;
  });

  const reviewColumns = [
    { 
      key: 'reviewer', 
      label: 'Customer',
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{row.date}</p>
        </div>
      )
    },
    { 
      key: 'worker', 
      label: 'Worker'
    },
    { 
      key: 'rating', 
      label: 'Rating',
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star}
              className={`h-4 w-4 ${
                star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
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
          {value && value.length > 50 && (
            <Button variant="link" size="sm" className="p-0 h-auto text-xs">
              Read more
            </Button>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="h-8">
            View Full
          </Button>
          {row.rating <= 2 && (
            <Button size="sm" variant="destructive" className="h-8">
              Flag
            </Button>
          )}
        </div>
      )
    }
  ];

  const totalReviews = allReviews.length;
  const averageRating = totalReviews > 0 ? 
    allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;
  const highRatings = allReviews.filter(r => r.rating >= 4).length;
  const lowRatings = allReviews.filter(r => r.rating <= 2).length;

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
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Platform rating</p>
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

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = allReviews.filter(r => r.rating === rating).length;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                
                return (
                  <div key={rating} className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <span className="font-medium mr-2">{rating}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mb-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{count}</div>
                      <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

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
                  className="pl-10"
                />
              </div>
              
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="high">High (4-5 Stars)</SelectItem>
                  <SelectItem value="medium">Medium (3 Stars)</SelectItem>
                  <SelectItem value="low">Low (1-2 Stars)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <DataTable
          title={`Reviews (${filteredReviews.length})`}
          columns={reviewColumns}
          data={filteredReviews}
          onView={(review) => console.log('View review:', review)}
          onEdit={(review) => console.log('Edit review:', review)}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminReviews;
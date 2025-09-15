import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, User, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '../dashboard/DashboardLayout';

export const CustomerReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await apiClient.get('/dashboard/reviews');
      if (error || !data?.success) {
        throw error || new Error('Failed to fetch reviews');
      }

      const reviewsData = (data as any).reviews || [];
      const statsData = (data as any).stats || { averageRating: 0, totalReviews: 0, ratingDistribution: { 5:0,4:0,3:0,2:0,1:0 } };

      setReviews(reviewsData);
      setStats({
        averageRating: Number(statsData.averageRating || 0),
        totalReviews: Number(statsData.totalReviews || 0),
        ratingDistribution: statsData.ratingDistribution || { 5:0,4:0,3:0,2:0,1:0 }
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout userType="customer" title="Reviews">
    <div className="space-y-6">
      {/* Review Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold mb-2">
              {stats.totalReviews}
            </div>
            <p className="text-muted-foreground">Total Reviews</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className={`text-3xl font-bold mb-2 ${getRatingColor(stats.averageRating)}`}>
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
            </div>
            <div className="flex items-center justify-center space-x-1 mb-2">
              {stats.averageRating > 0 && renderStars(stats.averageRating)}
            </div>
            <p className="text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center space-x-2">
                  <span className="text-sm w-3">{star}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: stats.totalReviews > 0 
                          ? `${(stats.ratingDistribution[star as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">
                    {stats.ratingDistribution[star as keyof typeof stats.ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews from Workers</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reviews yet</p>
              <p className="text-sm">Complete more bookings to receive reviews from workers</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-muted pb-6 last:border-b-0">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.reviewer?.avatar_url} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">
                            {review.reviewer?.first_name} {review.reviewer?.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Service: {review.booking?.service?.title || 'Unknown Service'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-1">
                            {renderStars(review.rating)}
                            <Badge variant="outline" className="ml-2">
                              {review.rating}/5
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {review.comment && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm leading-relaxed">{review.comment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div></DashboardLayout>
  );
};
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Calendar, DollarSign } from 'lucide-react';

interface WorkerCardProps {
  worker: any;
  onBookService: (workerId: string, serviceId: string) => void;
  onViewProfile: (workerId: string) => void;
}

export const WorkerCard = ({ worker, onBookService, onViewProfile }: WorkerCardProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 4.8) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (rating >= 4.5) return 'bg-green-100 text-green-800 border-green-200';
    if (rating >= 4.0) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (rating >= 3.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTopWorkerBadge = (rating: number, totalReviews: number) => {
    if (rating >= 4.8 && totalReviews >= 10) {
      return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold">⭐ Top Rated</Badge>;
    }
    if (rating >= 4.5 && totalReviews >= 5) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">🏆 Excellent</Badge>;
    }
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={worker.profiles?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {worker.profiles?.first_name?.[0]}{worker.profiles?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">
                  {worker.profiles?.first_name} {worker.profiles?.last_name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  {worker.location && (
                    <div className="flex items-center text-muted-foreground text-sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      {worker.location}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-1">
                {getTopWorkerBadge(worker.rating || 0, worker.total_reviews || 0)}
                {worker.rating > 0 && (
                  <Badge 
                    variant="outline" 
                    className={getRatingBadgeColor(worker.rating)}
                  >
                    {worker.rating.toFixed(1)} ⭐
                  </Badge>
                )}
              </div>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center space-x-2">
                {renderStars(worker.rating || 0)}
                <span className="font-medium text-sm">
                  {worker.rating ? worker.rating.toFixed(1) : '0.0'}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({worker.total_reviews || 0} review{worker.total_reviews !== 1 ? 's' : ''})
              </span>
              {worker.is_verified && (
                <Badge variant="secondary" className="text-xs">
                  ✓ Verified
                </Badge>
              )}
            </div>

            {/* Worker Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-medium">${worker.hourly_rate || 0}/hr</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Experience:</span>
                <span className="font-medium">{worker.experience_years || 0} years</span>
              </div>
            </div>

            {/* Bio */}
            {worker.bio && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {worker.bio}
              </p>
            )}

            {/* Services */}
            {worker.services && worker.services.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Services:</h4>
                <div className="flex flex-wrap gap-2">
                  {worker.services.slice(0, 3).map((service: any) => (
                    <Badge key={service.id} variant="outline" className="text-xs">
                      {service.title}
                    </Badge>
                  ))}
                  {worker.services.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{worker.services.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onViewProfile(worker.id)}
              >
                View Profile
              </Button>
              {worker.services && worker.services.length > 0 && (
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onBookService(worker.id, worker.services[0].id)}
                >
                  Book Service
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
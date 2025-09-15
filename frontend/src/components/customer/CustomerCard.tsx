import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, User } from 'lucide-react';

interface CustomerCardProps {
  customer: any;
  onViewProfile?: (customerId: string) => void;
  onContact?: (customerId: string) => void;
}

export const CustomerCard = ({ customer, onViewProfile, onContact }: CustomerCardProps) => {
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

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-500';
    if (rating >= 4.0) return 'bg-blue-500';
    if (rating >= 3.5) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getReliabilityBadge = (rating: number, totalReviews: number) => {
    if (rating >= 4.8 && totalReviews >= 10) {
      return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Excellent Customer</Badge>;
    }
    if (rating >= 4.5 && totalReviews >= 5) {
      return <Badge className="bg-gradient-to-r from-blue-500 to-green-500 text-white">Reliable Customer</Badge>;
    }
    return null;
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={customer.avatar_url} />
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg truncate">
                {customer.first_name} {customer.last_name}
              </h3>
              {getReliabilityBadge(customer.customer_rating || 0, customer.customer_total_reviews || 0)}
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              {customer.customer_rating > 0 && (
                <>
                  <div className="flex items-center space-x-1">
                    {renderStars(customer.customer_rating)}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getRatingBadgeColor(customer.customer_rating)}`}>
                    {customer.customer_rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({customer.customer_total_reviews} reviews)
                  </span>
                </>
              )}
              {customer.customer_rating === 0 && (
                <span className="text-sm text-muted-foreground">No reviews yet</span>
              )}
            </div>
            
            {customer.location && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-3">
                <MapPin className="h-4 w-4" />
                <span>{customer.location}</span>
              </div>
            )}
            
            <div className="flex space-x-2">
              {onViewProfile && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewProfile(customer.id)}
                >
                  View Profile
                </Button>
              )}
              {onContact && (
                <Button 
                  size="sm"
                  onClick={() => onContact(customer.id)}
                >
                  Contact
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, User } from 'lucide-react';
import { WorkerProfile } from '@/hooks/useWorkerSearch';
import { formatDistance } from '@/lib/utils';

interface AvailableWorkersProps {
  workers: WorkerProfile[];
  loading: boolean;
  error: string | null;
  onWorkerSelect: (worker: WorkerProfile) => void;
}

export const AvailableWorkers: React.FC<AvailableWorkersProps> = ({
  workers,
  loading,
  error,
  onWorkerSelect
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Searching for available workers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm text-red-800">Error: {error}</span>
        </div>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-sm text-yellow-800">
            No workers found within 10 miles of your selected location.
          </span>
        </div>
        <p className="text-xs text-yellow-700 mt-2">
          Try selecting a different location or expanding your search area.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Available Workers</h3>
        <Badge variant="secondary">
          {workers.length} worker{workers.length !== 1 ? 's' : ''} found
        </Badge>
      </div>
      
      <div className="grid gap-4">
        {workers.map((worker) => (
          <Card key={worker.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={worker.avatar_url} alt={`${worker.first_name} ${worker.last_name}`} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-sm">
                        {worker.first_name} {worker.last_name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {worker.city}, {worker.postcode}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {worker.distance ? formatDistance(worker.distance) : 'Distance unknown'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-3">
                    {worker.customer_rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-muted-foreground">
                          {worker.customer_rating.toFixed(1)}
                        </span>
                        {worker.customer_total_reviews && (
                          <span className="text-xs text-muted-foreground">
                            ({worker.customer_total_reviews} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <Button 
                      size="sm" 
                      onClick={() => onWorkerSelect(worker)}
                      className="w-full"
                    >
                      Select Worker
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

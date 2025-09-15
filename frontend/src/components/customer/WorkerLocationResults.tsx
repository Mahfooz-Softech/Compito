import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Star, 
  DollarSign, 
  Clock, 
  User,
  MessageSquare,
  Phone,
  Mail,
  Check
} from 'lucide-react';
import { WorkerLocation } from '@/lib/workerLocationService';

interface WorkerLocationResultsProps {
  workers: WorkerLocation[];
  loading: boolean;
  error: string | null;
  workerCounts: {
    within5Miles: number;
    within10Miles: number;
    within20Miles: number;
    total: number;
  } | null;
  onWorkerSelect?: (worker: WorkerLocation) => void;
  onContactWorker?: (worker: WorkerLocation) => void;
  selectedWorkers?: string[];
  className?: string;
}

export const WorkerLocationResults: React.FC<WorkerLocationResultsProps> = ({
  workers,
  loading,
  error,
  workerCounts,
  onWorkerSelect,
  onContactWorker,
  selectedWorkers,
  className = ""
}) => {
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Searching for workers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Search Error</div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!workers || workers.length === 0) {
    return (
      <div className={`p-6 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600 text-lg font-medium mb-2">No Workers Found</div>
          <p className="text-gray-500">No available workers found in your area. Try expanding your search radius.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Worker Counts Summary */}
      {/* {workerCounts && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900">Worker Availability Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{workerCounts.within5Miles}</div>
                <div className="text-sm text-blue-700">Within 5 miles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{workerCounts.within10Miles}</div>
                <div className="text-sm text-blue-700">Within 10 miles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{workerCounts.within20Miles}</div>
                <div className="text-sm text-blue-700">Within 20 miles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{workerCounts.total}</div>
                <div className="text-sm text-blue-700">Total Available</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Workers List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Available Workers ({workers.length})
        </h3>
        
        {workers.map((worker) => {
          const isSelected = selectedWorkers?.includes(worker.id) || false;
          
          return (
            <Card 
              key={worker.id} 
              className={`hover:shadow-md transition-all duration-300 ease-in-out ${
                isSelected 
                  ? 'border-2 border-green-500 bg-green-50 shadow-lg scale-[1.02]' 
                  : 'hover:shadow-md transition-shadow'
              }`}
            >
            <CardContent className="p-6 relative">
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="flex items-start space-x-4">
                {/* Worker Avatar */}
                <Avatar className="h-16 w-16">
                  <AvatarImage src={worker.avatar_url || undefined} alt={`${worker.first_name} ${worker.last_name}`} />
                  <AvatarFallback className="text-lg">
                    {worker.first_name?.[0]}{worker.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>

                {/* Worker Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className={`text-lg font-semibold ${isSelected ? 'text-green-800' : 'text-gray-900'}`}>
                        {worker.first_name} {worker.last_name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {worker.distance} miles away
                        </Badge>
                        {worker.is_online && (
                          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                            Online
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Rating */}
                    {worker.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-900">
                          {worker.rating.toFixed(1)}
                        </span>
                        {worker.total_reviews && (
                          <span className="text-xs text-gray-500">
                            ({worker.total_reviews})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {worker.bio && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {worker.bio}
                    </p>
                  )}

                  {/* Worker Details */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    {worker.hourly_rate && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>£{worker.hourly_rate}/hr</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{worker.postcode}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {onWorkerSelect && (
                      <Button
                        onClick={() => onWorkerSelect(worker)}
                        className={`flex-1 ${
                          isSelected 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : ''
                        }`}
                      >
                        <User className="h-4 w-4 mr-2" />
                        {isSelected ? 'Selected' : 'Select Worker'}
                      </Button>
                    )}
                    
                    {onContactWorker && (
                      <Button
                        variant="outline"
                        onClick={() => onContactWorker(worker)}
                        className="flex-1"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>
    </div>
  );
};
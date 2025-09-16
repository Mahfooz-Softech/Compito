import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, CheckCircle, User, Award, MapPin } from 'lucide-react';

interface WorkerDetails {
  id: string;
  name: string;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  experience_years: number;
  bio?: string;
  location?: string | null;
  specialties?: string[];
}

interface WorkerDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerDetails | null;
  onBookNow: () => void;
}

const WorkerDetailsPopup: React.FC<WorkerDetailsPopupProps> = ({
  isOpen,
  onClose,
  worker,
  onBookNow
}) => {
  if (!worker) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{worker.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {worker.is_verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{worker.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({worker.total_reviews} reviews)
                  </span>
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Experience and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Experience</p>
                <p className="text-sm text-muted-foreground">
                  {worker.experience_years}+ years
                </p>
              </div>
            </div>
            {worker.location && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{worker.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bio */}
          {worker.bio && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground leading-relaxed">{worker.bio}</p>
            </div>
          )}

          {/* Specialties */}
          {!!(worker.specialties && worker.specialties.length) && (
            <div>
              <h3 className="font-semibold mb-3">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {worker.specialties!.map((specialty, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Customer Reviews
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{worker.rating.toFixed(1)}</div>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(worker.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on {worker.total_reviews} reviews
                </p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {worker.is_verified 
                    ? "This worker has been verified and has a proven track record of quality service."
                    : "This worker is building their reputation with quality service."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={onBookNow} 
              className="flex-1 btn-hero"
            >
              Book Now
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-8"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkerDetailsPopup;



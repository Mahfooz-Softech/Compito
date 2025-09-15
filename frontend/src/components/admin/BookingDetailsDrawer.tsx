import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  User, 
  Hash, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface BookingDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
}

export const BookingDetailsDrawer: React.FC<BookingDetailsDrawerProps> = ({
  isOpen,
  onClose,
  booking
}) => {
  if (!booking) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: 'default' as const, color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
      pending: { variant: 'secondary' as const, color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
      confirmed: { variant: 'outline' as const, color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
      cancelled: { variant: 'destructive' as const, color: 'bg-red-500/10 text-red-700 border-red-200' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={`${config.color} font-medium capitalize`}>
        {status || 'pending'}
      </Badge>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[70%] sm:max-w-[70%] overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl font-bold">Booking Details</SheetTitle>
          {booking && (
            <Badge variant="outline" className="ml-2">
              #{booking.id.slice(-8)}
            </Badge>
          )}
        </SheetHeader>
        
        {booking && (
          <div className="space-y-6 pt-4">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Booking Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    <span className="font-mono text-sm">{booking.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">{new Date(booking.scheduled_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(booking.scheduled_date).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-600">
                      {booking.total_amount ? `$${booking.total_amount}` : 'TBD'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/20 bg-accent/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-medium text-foreground">{booking.customer_name}</p>
                    <p className="text-sm text-muted-foreground font-mono">ID: {booking.customer_id}</p>
                  </div>
                  {booking.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{booking.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-violet-500/20 bg-violet-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Worker Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-medium text-foreground">{booking.worker_name}</p>
                    <p className="text-sm text-muted-foreground font-mono">ID: {booking.worker_id}</p>
                  </div>
                  <Badge variant={booking.worker_id ? "default" : "secondary"}>
                    {booking.worker_id ? 'Assigned' : 'Unassigned'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Service & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Service Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {booking.service_title || (booking.service_id ? 'Service Unavailable' : 'No Service Linked')}
                    </p>
                    {booking.service_category && (
                      <Badge variant="outline" className="mt-1">
                        {booking.service_category}
                      </Badge>
                    )}
                  </div>
                  {booking.service_id && (
                    <p className="text-sm text-muted-foreground font-mono">Service ID: {booking.service_id}</p>
                  )}
                  {booking.duration_hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.duration_hours} hours</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Status & Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created: </span>
                      <span>{new Date(booking.created_at).toLocaleString()}</span>
                    </div>
                    {booking.worker_completed_at && (
                      <div>
                        <span className="text-muted-foreground">Worker Completed: </span>
                        <span>{new Date(booking.worker_completed_at).toLocaleString()}</span>
                      </div>
                    )}
                    {booking.customer_confirmed_at && (
                      <div>
                        <span className="text-muted-foreground">Customer Confirmed: </span>
                        <span>{new Date(booking.customer_confirmed_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Information */}
            {(booking.commission_rate || booking.commission_amount || booking.worker_payout) && (
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Financial Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {booking.total_amount && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-emerald-600">
                          ${booking.total_amount}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Amount</div>
                      </div>
                    )}
                    {booking.commission_amount && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-primary">
                          ${booking.commission_amount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Commission ({((booking.commission_rate || 0) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    )}
                    {booking.worker_payout && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-violet-600">
                          ${booking.worker_payout}
                        </div>
                        <div className="text-xs text-muted-foreground">Worker Payout</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {booking.notes && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{booking.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

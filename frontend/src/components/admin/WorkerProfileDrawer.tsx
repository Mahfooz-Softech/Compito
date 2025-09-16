import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building,
  FileText,
  Handshake,
  Award
} from 'lucide-react';

interface WorkerProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  created_at: string;
  category_name: string;
  category_description: string;
  is_active: boolean;
  deactivated_at?: string;
  deactivation_reason?: string;
  months_since_creation: number;
  unique_customers_count: number;
  risk_level: string;
  admin_id?: string;
}

interface Booking {
  id: string;
  service_id: string;
  customer_name: string;
  status: string;
  created_at: string;
  scheduled_date: string;
  total_amount: number;
}

interface Service {
  id: string;
  title: string;
  description: string;
  price_min: number | null;
  price_max: number | null;
  duration_hours: number | null;
  category_id: string | null;
  category_name: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
  review_type: string;
}

interface WorkerProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string | null;
}

export const WorkerProfileDrawer: React.FC<WorkerProfileDrawerProps> = ({
  isOpen,
  onClose,
  workerId
}) => {
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && workerId) {
      fetchWorkerData();
    }
  }, [isOpen, workerId]);

  const fetchWorkerData = async () => {
    if (!workerId) return;
    setLoading(true);
    try {
      // Fetch worker overview data
      const { data: workerResp, error: workerErr } = await apiClient.get(`/worker-data/${workerId}`);
      if (workerErr) throw workerErr;

      const w = workerResp?.worker;
      const stats = workerResp?.stats;
      const recentJobs = (workerResp?.recent_jobs || []) as any[];
      const workerServices = (workerResp?.worker_services || []) as any[];

      if (w) {
        const monthsSinceCreation = 0;
        const completedJobs = stats?.completed_jobs ?? 0;
        let riskLevel = 'No Risk';
        if (completedJobs === 0) riskLevel = 'Low Risk';

        const wp: WorkerProfile = {
          id: String(w.id),
          first_name: w.first_name || '',
          last_name: w.last_name || '',
          email: w.email || 'Email not available',
          phone: w.phone || '',
          created_at: w.created_at || new Date().toISOString(),
          category_name: stats?.category || workerResp?.worker?.category?.name || 'Unassigned',
          category_description: '—',
          is_active: true,
          months_since_creation: monthsSinceCreation,
          unique_customers_count: completedJobs,
          risk_level: riskLevel,
          admin_id: String(w.id)
        };
        setWorker(wp);
      } else {
        setWorker(null);
      }

      // Map bookings from recent_jobs
      const mappedBookings: Booking[] = recentJobs.map((b: any) => ({
        id: b.id,
        service_id: b.service_id || '',
        customer_name: b.customer_name || 'Customer',
        status: b.status || 'pending',
        created_at: b.created_at,
        scheduled_date: b.scheduled_date || b.created_at,
        total_amount: Number(b.total_amount || 0)
      }));
      setBookings(mappedBookings);

      // Map services from worker_services
      const mappedServices: Service[] = workerServices.map((s: any) => ({
        id: s.id,
        title: s.title || 'Service',
        description: s.description || '',
        price_min: s.price_min ?? null,
        price_max: s.price_max ?? null,
        duration_hours: s.duration_hours ?? null,
        category_id: s.category_id ?? null,
        category_name: s.category?.name || s.category_name || 'Unassigned',
      }));
      setServices(mappedServices);

      // Fetch reviews for this worker via backend
      try {
        const { data: reviewsResp, error: reviewsErr } = await apiClient.get(`/worker/reviews/${workerId}`);
        if (!reviewsErr && reviewsResp && Array.isArray(reviewsResp.reviews)) {
          const mappedReviews: Review[] = reviewsResp.reviews.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment || '',
            reviewer_name: r.reviewer_name || r.customer_name || 'Unknown Reviewer',
            created_at: r.created_at,
            review_type: r.review_type || 'customer'
          }));
          setReviews(mappedReviews);
        } else {
          setReviews([]);
        }
      } catch {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching worker data:', error);
      toast.error('Failed to fetch worker profile data');
      setWorker(null);
      setBookings([]);
      setServices([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><UserCheck className="h-3 w-3 mr-1" />Active</Badge>;
    } else {
      return <Badge variant="destructive"><UserX className="h-3 w-3 mr-1" />Deactivated</Badge>;
    }
  };

  const getRiskLevelBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High Risk':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />High Risk</Badge>;
      case 'Medium Risk':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Medium Risk</Badge>;
      case 'Low Risk':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Low Risk</Badge>;
      default:
        return <Badge variant="outline" className="bg-green-100 text-green-800"><Shield className="h-3 w-3 mr-1" />No Risk</Badge>;
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (!worker) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[70%] sm:max-w-[70%] overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl font-bold">Worker Profile</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading worker profile...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="" alt={`${worker.first_name} ${worker.last_name}`} />
                    <AvatarFallback className="text-lg">
                      {worker.first_name?.[0]}{worker.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                        <p className="font-semibold">{worker.first_name} {worker.last_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="font-semibold">{worker.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Admin ID</p>
                        <p className="font-semibold">{worker.admin_id}</p>
                      </div>
                      {worker.phone && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Phone</p>
                          <p className="font-semibold">{worker.phone}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Category</p>
                        <p className="font-semibold">{worker.category_name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(worker.is_active)}
                      {getRiskLevelBadge(worker.risk_level)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Account Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{worker.months_since_creation}</p>
                    <p className="text-sm text-muted-foreground">Months Active</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{worker.unique_customers_count}</p>
                    <p className="text-sm text-muted-foreground">Completed Jobs</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{services.length}</p>
                    <p className="text-sm text-muted-foreground">Active Services</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Detailed Information */}
            <Tabs defaultValue="bookings" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bookings" className="flex items-center gap-2">
                  <Handshake className="h-4 w-4" />
                  Bookings ({bookings.length})
                </TabsTrigger>
                <TabsTrigger value="services" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Services ({services.length})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Reviews ({reviews.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bookings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bookings.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No bookings found</p>
                    ) : (
                      <div className="space-y-3">
                        {bookings.map((booking) => (
                          <div key={booking.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{booking.customer_name}</h4>
                              {getBookingStatusBadge(booking.status)}
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Scheduled Date</p>
                                <p>{new Date(booking.scheduled_date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Amount</p>
                                <p>${booking.total_amount}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Created</p>
                                <p>{new Date(booking.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {services.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No services found</p>
                    ) : (
                      <div className="space-y-3">
                        {services.map((service) => (
                          <div key={service.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{service.title}</h4>
                              <Badge variant="default">Active</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Price Range</p>
                                <p>
                                  {service.price_min && service.price_max 
                                    ? `$${service.price_min} - $${service.price_max}`
                                    : service.price_min 
                                      ? `$${service.price_min}+`
                                      : 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Duration</p>
                                <p>{service.duration_hours ? `${service.duration_hours}h` : 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Category</p>
                                <p>{service.category_name}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviews.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No reviews found</p>
                    ) : (
                      <div className="space-y-3">
                        {reviews.map((review) => (
                          <div key={review.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">{review.reviewer_name}</h4>
                                <p className="text-sm text-muted-foreground">{review.review_type}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                {getRatingStars(review.rating)}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm mb-2">{review.comment}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

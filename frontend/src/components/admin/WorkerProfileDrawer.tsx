import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import apiClient from '@/lib/apiClient';
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
    console.log('fetchWorkerData called with workerId:', workerId, typeof workerId);
    if (!workerId) {
      console.error('workerId is null or undefined in fetchWorkerData');
      return;
    }
    
    setLoading(true);
    try {
      // Use backend API for worker profile and related data
      try {
        const { data: workerData, error: workerError } = await apiClient.getWorkerData(String(workerId));
        if (workerError) throw workerError;

        const profileId = workerData?.id || workerData?.profile?.id || workerId;
        const firstName = workerData?.first_name || workerData?.profile?.first_name || '';
        const lastName = workerData?.last_name || workerData?.profile?.last_name || '';
        const phone = workerData?.phone || workerData?.profile?.phone || '';
        const createdAt = workerData?.created_at || workerData?.profile?.created_at || new Date().toISOString();
        const completedJobs = workerData?.completed_jobs ?? workerData?.stats?.completed_jobs ?? 0;
        const isActive = workerData?.is_active ?? workerData?.status !== 'deactivated';
        const deactivatedAt = workerData?.deactivated_at ?? undefined;
        const deactivationReason = workerData?.deactivation_reason ?? undefined;
        const email = workerData?.email || workerData?.profile?.email || 'Email not available';

        const monthsSinceCreation = Math.floor(
          (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        let riskLevel = 'No Risk';
        if (monthsSinceCreation >= 3 && completedJobs === 0) {
          riskLevel = 'High Risk';
        } else if (monthsSinceCreation >= 2 && completedJobs === 0) {
          riskLevel = 'Medium Risk';
        } else if (monthsSinceCreation >= 1 && completedJobs === 0) {
          riskLevel = 'Low Risk';
        }

        const workerProfile: WorkerProfile = {
          id: String(profileId),
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          created_at: createdAt,
          category_name: workerData?.category?.name || workerData?.category_name || 'Unassigned',
          category_description: workerData?.category?.description || workerData?.category_description || 'No category assigned',
          is_active: Boolean(isActive),
          deactivated_at: deactivatedAt,
          deactivation_reason: deactivationReason,
          months_since_creation: monthsSinceCreation,
          unique_customers_count: completedJobs,
          risk_level: riskLevel,
          admin_id: String(profileId)
        };

        setWorker(workerProfile);

        const servicesData = (workerData?.services || []) as any[];
        const servicesWithCategories = servicesData.map((service) => ({
          ...service,
          category_name: service.category_name || service.category?.name || 'Unassigned'
        }));
        setServices(servicesWithCategories);

        const bookingsData = (workerData?.bookings || []) as any[];
        const bookingsWithNames = bookingsData.map((booking) => ({
          ...booking,
          customer_name: booking.customer_name || booking.customer?.name || booking.customer?.full_name || 'Unknown Customer'
        }));
        setBookings(bookingsWithNames);

        const reviewsData = (workerData?.reviews || []) as any[];
        const reviewsWithNames = reviewsData.map((review) => ({
          ...review,
          reviewer_name: review.reviewer_name || review.reviewer?.name || 'Unknown Reviewer'
        }));
        setReviews(reviewsWithNames);

        return;
      } catch (apiError) {
        console.warn('Backend API failed for worker profile, falling back to legacy code', apiError);
      }
      // Fetch worker profile data from worker_profiles table
      const { data: workerData, error: workerError } = await supabase
        .from('worker_profiles')
        .select(`
          id,
          category_id,
          completed_jobs
        `)
        .eq('id', workerId)
        .single();

      if (workerError) throw workerError;
      
      console.log('Worker profile data fetched:', workerData);

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone, created_at, user_type')
        .eq('id', workerId)
        .single();

      if (profileError) throw profileError;
      
      console.log('Profile data fetched:', profileData);

                                         // Fetch email using custom RPC function
        let userEmail = 'Email not available';
        try {
          const { data, error } = await supabase.rpc('get_user_email_by_profile_id' as any, { profile_id: workerId });
          
          if (!error && data) {
            userEmail = data as string;
          }
        } catch (err) {
          console.error("Error fetching user email:", err);
        }

      // Fetch category data (only if category_id exists)
      let categoryData = null;
      if (workerData.category_id) {
        const { data: catData, error: categoryError } = await supabase
          .from('worker_categories')
          .select('name, description')
          .eq('id', workerData.category_id)
          .single();

        if (categoryError) {
          console.warn('Could not fetch category data:', categoryError);
        } else {
          categoryData = catData;
        }
      }

      // Calculate months since creation
      const monthsSinceCreation = Math.floor(
        (Date.now() - new Date(profileData.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );

      // Calculate risk level
      let riskLevel = 'No Risk';
      if (monthsSinceCreation >= 3 && workerData.completed_jobs === 0) {
        riskLevel = 'High Risk';
      } else if (monthsSinceCreation >= 2 && workerData.completed_jobs === 0) {
        riskLevel = 'Medium Risk';
      } else if (monthsSinceCreation >= 1 && workerData.completed_jobs === 0) {
        riskLevel = 'Low Risk';
      }

             const workerProfile: WorkerProfile = {
         id: profileData.id,
         first_name: profileData.first_name || '',
         last_name: profileData.last_name || '',
         email: userEmail,
         phone: profileData.phone || '',
         created_at: profileData.created_at,
         category_name: categoryData?.name || 'Unassigned',
         category_description: categoryData?.description || 'No category assigned',
         is_active: true, // Default to active for now
         deactivated_at: undefined,
         deactivation_reason: undefined,
         months_since_creation: monthsSinceCreation,
         unique_customers_count: workerData.completed_jobs || 0,
         risk_level: riskLevel,
         admin_id: profileData.id // Using the worker's profile ID as admin can see this
       };

      setWorker(workerProfile);

             // Fetch services for this worker directly from services table
       const { data: servicesData, error: servicesError } = await supabase
         .from('services')
         .select(`
           id,
           title,
           description,
           price_min,
           price_max,
           duration_hours,
           category_id
         `)
         .eq('worker_id', workerId);

       if (servicesError) {
         console.warn('Could not fetch services:', servicesError);
       } else if (servicesData) {
         // Get category names for services
         const categoryIds = [...new Set(servicesData.map(s => s.category_id).filter(Boolean))];
         let categoryData = null;
         if (categoryIds.length > 0) {
           const { data: catData } = await supabase
             .from('categories')
             .select('id, name')
             .in('id', categoryIds);
           categoryData = catData;
         }

         const servicesWithCategories = servicesData.map(service => {
           const category = categoryData?.find(c => c.id === service.category_id);
           return {
             ...service,
             category_name: category?.name || 'Unassigned'
           };
         });
                  setServices(servicesWithCategories);
       }

      // Fetch bookings for this worker directly from bookings table
      // Since bookings are linked to services, we need to get all services first, then get bookings for those services
      if (servicesData && servicesData.length > 0) {
        const serviceIds = servicesData.map(s => s.id);
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            service_id,
            customer_id,
            status,
            scheduled_date,
            total_amount,
            created_at
          `)
          .in('service_id', serviceIds)
          .order('created_at', { ascending: false });

        if (bookingsError) {
          console.warn('Could not fetch bookings:', bookingsError);
        } else if (bookingsData) {
          // Get customer names for bookings
          const customerIds = [...new Set(bookingsData.map(b => b.customer_id))];
          const { data: customerData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', customerIds);

          const bookingsWithNames = bookingsData.map(booking => {
            const customer = customerData?.find(c => c.id === booking.customer_id);
            return {
              ...booking,
              customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown Customer'
            };
          });
          setBookings(bookingsWithNames);
        }
      }

      // Fetch reviews for this worker
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          reviewer_id,
          created_at,
          review_type
        `)
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.warn('Could not fetch reviews:', reviewsError);
      } else if (reviewsData) {
        // Get reviewer names for reviews
        const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
        const { data: reviewerData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', reviewerIds);

        const reviewsWithNames = reviewsData.map(review => {
          const reviewer = reviewerData?.find(r => r.id === review.reviewer_id);
          return {
            ...review,
            reviewer_name: reviewer ? `${reviewer.first_name} ${reviewer.last_name}` : 'Unknown Reviewer'
          };
        });
        setReviews(reviewsWithNames);
      }

    } catch (error) {
      console.error('Error fetching worker data:', error);
      toast.error('Failed to fetch worker profile data');
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
                               <Badge variant="default">
                                 Active
                               </Badge>
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
                                       : 'Not specified'
                                   }
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

            {/* Deactivation Information (if applicable) */}
            {!worker.is_active && worker.deactivation_reason && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Account Deactivation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Reason:</p>
                    <p className="text-sm text-red-700">{worker.deactivation_reason}</p>
                    {worker.deactivated_at && (
                      <p className="text-xs text-muted-foreground">
                        Deactivated on: {new Date(worker.deactivated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

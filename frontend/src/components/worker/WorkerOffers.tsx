import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, DollarSign, User, AlertCircle, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { categorizeOffers, getOfferStatusColor, getOfferStatusIcon, type Offer } from '@/lib/offerUtils';

export const WorkerOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const { activeOffers, expiredOffers } = categorizeOffers(offers);

  const fetchOffers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          services(title)
        `)
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false});

      if (error) throw error;

      // Fetch customer profiles separately
      const customerIds = [...new Set(data?.map(offer => offer.customer_id))];
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', customerIds);

      const formattedOffers = data?.map(offer => {
        const customer = customers?.find(c => c.id === offer.customer_id);
        return {
          ...offer,
          customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown Customer',
          service_title: offer.services?.title || 'Unknown Service',
          status: offer.status as 'pending' | 'accepted' | 'rejected' | 'withdrawn'
        };
      }) || [];

      setOffers(formattedOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const withdrawOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'withdrawn' })
        .eq('id', offerId)
        .eq('worker_id', user?.id);

      if (error) throw error;

      toast({
        title: "Offer withdrawn",
        description: "Your offer has been withdrawn successfully",
      });

      fetchOffers();
    } catch (error) {
      console.error('Error withdrawing offer:', error);
      toast({
        title: "Error",
        description: "Failed to withdraw offer",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [user]);

  const renderOfferCard = (offer: Offer) => (
    <Card key={offer.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{offer.service_title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4" />
              {offer.customer_name}
            </CardDescription>
          </div>
          <Badge className={getOfferStatusColor(offer.status)}>
            <span className="mr-1">{getOfferStatusIcon(offer.status)}</span>
            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-medium">${offer.price}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{offer.estimated_hours}h</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span>{formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        
        <p className="text-gray-700 mb-4">{offer.description}</p>
        
        {offer.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => withdrawOffer(offer.id)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Withdraw Offer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Offers</h2>
          <p className="text-gray-600">Manage your service offers</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {activeOffers.length} Active
          </Badge>
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            {expiredOffers.length} Expired
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Active Offers ({activeOffers.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Expired Offers ({expiredOffers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeOffers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Offers</h3>
                <p className="text-gray-600">You don't have any pending offers at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeOffers.map(renderOfferCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          {expiredOffers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Expired Offers</h3>
                <p className="text-gray-600">All your offers are currently active.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {expiredOffers.map(renderOfferCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
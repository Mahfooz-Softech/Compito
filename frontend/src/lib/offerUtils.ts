import { subDays } from 'date-fns';

export interface Offer {
  id: string;
  worker_id: string;
  customer_id: string;
  service_id: string;
  service_request_id?: string | null;
  price: number;
  estimated_hours: number;
  description: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'completed';
  stripe_session_id?: string | null;
  created_at: string;
  expires_at: string;
  worker_name?: string;
  customer_name?: string;
  service_title?: string;
}

export interface CategorizedOffers {
  activeOffers: Offer[];
  expiredOffers: Offer[];
}

export const categorizeOffers = (offers: Offer[]): CategorizedOffers => {
  const now = new Date();
  const oneMonthAgo = subDays(now, 30);

  const activeOffers: Offer[] = [];
  const expiredOffers: Offer[] = [];

  offers.forEach(offer => {
    const offerDate = new Date(offer.created_at);
    
    if (offer.status === 'pending') {
      // Check if pending offer is older than a month (expired)
      if (offerDate < oneMonthAgo) {
        expiredOffers.push(offer);
      } else {
        // Active pending offers
        activeOffers.push(offer);
      }
    } else if (offer.status === 'accepted' && offer.stripe_session_id) {
      // Offers that are accepted but payment is pending - keep them visible
      activeOffers.push(offer);
    } else if (offer.status === 'rejected' || offer.status === 'withdrawn') {
      // Rejected or withdrawn offers go to expired
      expiredOffers.push(offer);
    }
    // Note: completed offers (payment successful) are moved to bookings, so they don't appear here
  });

  return {
    activeOffers: activeOffers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    expiredOffers: expiredOffers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  };
};

export const getOfferStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'accepted':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'withdrawn':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getOfferStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return '⏳';
    case 'accepted':
      return '💳';
    case 'completed':
      return '✅';
    case 'rejected':
      return '❌';
    case 'withdrawn':
      return '↩️';
    default:
      return '❓';
  }
};

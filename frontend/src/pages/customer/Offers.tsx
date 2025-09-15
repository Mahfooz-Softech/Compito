import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CustomerOffers as CustomerOffersComponent } from '@/components/customer/CustomerOffers';

const CustomerOffers = () => {
  return (
    <DashboardLayout userType="customer" title="Service Offers">
      <CustomerOffersComponent />
    </DashboardLayout>
  );
};

export default CustomerOffers;
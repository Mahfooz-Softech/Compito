import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CustomerBookings } from '@/components/customer/CustomerBookings';

const CustomerBookingsPage = () => {
  return (
    <DashboardLayout userType="customer" title="My Bookings">
      <CustomerBookings />
    </DashboardLayout>
  );
};

export default CustomerBookingsPage;
import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WorkerBookings } from '@/components/worker/WorkerBookings';

const WorkerBookingsPage = () => {
  return (
    <DashboardLayout userType="worker" title="My Bookings">
      <WorkerBookings />
    </DashboardLayout>
  );
};

export default WorkerBookingsPage;
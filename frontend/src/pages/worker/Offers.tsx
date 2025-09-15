import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WorkerOffers } from '@/components/worker/WorkerOffers';

const WorkerOffersPage = () => {
  return (
    <DashboardLayout userType="worker" title="My Offers">
      <WorkerOffers />
    </DashboardLayout>
  );
};

export default WorkerOffersPage;
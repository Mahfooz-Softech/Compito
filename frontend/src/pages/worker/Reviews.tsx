import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WorkerReviews } from '@/components/worker/WorkerReviews';

const WorkerReviewsPage = () => {
  return (
    <DashboardLayout userType="worker" title="My Reviews">
      <WorkerReviews />
    </DashboardLayout>
  );
};

export default WorkerReviewsPage;
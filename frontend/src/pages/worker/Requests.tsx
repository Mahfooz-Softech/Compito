import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { WorkerServiceRequests } from './WorkerServiceRequests';

const WorkerRequests = () => {
  return (
    <DashboardLayout userType="worker" title="Service Requests">
      <WorkerServiceRequests />
    </DashboardLayout>
  );
};

export default WorkerRequests;
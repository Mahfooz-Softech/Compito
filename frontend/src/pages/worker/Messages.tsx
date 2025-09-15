import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ConversationManager } from '@/components/worker/ConversationManager';

const WorkerMessages = () => {
  return (
    <DashboardLayout userType="worker" title="Messages">
      <ConversationManager />
    </DashboardLayout>
  );
};

export default WorkerMessages;
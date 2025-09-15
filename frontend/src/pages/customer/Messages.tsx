import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MessageCenter } from '@/components/customer/MessageCenter';

const CustomerMessages = () => {
  return (
    <DashboardLayout userType="customer" title="Messages">
      <MessageCenter />
    </DashboardLayout>
  );
};

export default CustomerMessages;
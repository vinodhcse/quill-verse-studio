
import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import { AccountSidebar } from '@/components/Account/AccountSidebar';
import { AccountDetails } from '@/components/Account/AccountDetails';
import { SubscriptionManagement } from '@/components/Account/SubscriptionManagement';
import { BillingHistory } from '@/components/Account/BillingHistory';

export type AccountTab = 'details' | 'subscription' | 'billing';

const Account = () => {
  const [activeTab, setActiveTab] = useState<AccountTab>('details');

  const renderContent = () => {
    switch (activeTab) {
      case 'details':
        return <AccountDetails />;
      case 'subscription':
        return <SubscriptionManagement />;
      case 'billing':
        return <BillingHistory />;
      default:
        return <AccountDetails />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="flex">
        <AccountSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Account;

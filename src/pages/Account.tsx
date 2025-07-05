import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import { AccountSidebar } from '@/components/Account/AccountSidebar';
import { AccountDetails } from '@/components/Account/AccountDetails';
import { SubscriptionManagement } from '@/components/Account/SubscriptionManagement';
import { BillingHistory } from '@/components/Account/BillingHistory';
import { ProjectSettings } from '@/components/Account/ProjectSettings';
import { useUserContext } from '@/lib/UserContextProvider';

export type AccountTab = 'details' | 'subscription' | 'billing' | 'settings';

const Account = () => {
  const [activeTab, setActiveTab] = useState<AccountTab>('details');
  const { getUser } = useUserContext();
  const user = getUser();

  const renderContent = () => {
    switch (activeTab) {
      case 'details':
        return <AccountDetails />;
      case 'subscription':
        return <SubscriptionManagement />;
      case 'billing':
        return <BillingHistory />;
      case 'settings':
        return <ProjectSettings />;
      default:
        return <AccountDetails />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader />
      
      <div className="flex">
        <AccountSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-fade-in">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Account;

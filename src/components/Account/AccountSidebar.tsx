
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, CreditCard, FileText } from 'lucide-react';
import { AccountTab } from '@/pages/Account';

interface AccountSidebarProps {
  activeTab: AccountTab;
  onTabChange: (tab: AccountTab) => void;
}

export const AccountSidebar: React.FC<AccountSidebarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'details' as AccountTab, label: 'Account Details', icon: User },
    { id: 'subscription' as AccountTab, label: 'Subscription', icon: CreditCard },
    { id: 'billing' as AccountTab, label: 'Billing History', icon: FileText },
  ];

  return (
    <div className="w-64 bg-card border-r border-border min-h-screen pt-8">
      <div className="px-6">
        <h2 className="text-lg font-semibold mb-6">Account Settings</h2>
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

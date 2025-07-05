
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, CreditCard, FileText, Settings } from 'lucide-react';
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
    { id: 'settings' as AccountTab, label: 'Project Settings', icon: Settings },
  ];

  return (
    <div className="w-72 bg-card/50 backdrop-blur-sm border-r border-border/50 min-h-screen pt-8">
      <div className="px-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Account Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>
        
        <nav className="space-y-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start h-12 text-left transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-md' 
                    : 'hover:bg-muted/50 hover:translate-x-1'
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                <span className="font-medium">{tab.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

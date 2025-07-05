
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star } from 'lucide-react';

interface SubscriptionTier {
  id: string;
  name: string;
  price: {
    monthly: number;
    annual: number;
  };
  description: string;
  features: string[];
  icon: React.ComponentType<any>;
  popular?: boolean;
}

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 'FREE',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: '30 days trial with basic features',
    features: [
      'Basic writing tools',
      'Limited books (3)',
      'Data deleted after 2 months',
      'Community support'
    ],
    icon: Star
  },
  {
    id: 'HOBBYIST',
    name: 'Hobbyist & Student',
    price: { monthly: 3.99, annual: 35.88 },
    description: 'Perfect for individual writers',
    features: [
      'Unlimited books',
      'Basic AI features',
      'Export to PDF, DOCX',
      'Lifetime data retention',
      'Email support'
    ],
    icon: Zap,
    popular: true
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: { monthly: 5.99, annual: 59.88 },
    description: 'Advanced features for serious writers',
    features: [
      'Everything in Hobbyist',
      'Advanced AI features',
      'Export to EPUB',
      'Priority support',
      '1000 AI credits/month'
    ],
    icon: Crown
  },
  {
    id: 'ENTERPRISE',
    name: 'Max',
    price: { monthly: 7.99, annual: 83.88 },
    description: 'Maximum features for professionals',
    features: [
      'Everything in Pro',
      'Audio book conversion',
      'AI model customization',
      'Unlimited AI credits',
      'Dedicated support'
    ],
    icon: Crown
  }
];

export const SubscriptionManagement = () => {
  const currentSubscription = 'FREE'; // This should come from API or context

  const handleSubscribe = (tierId: string) => {
    // TODO: Implement subscription logic
    console.log('Subscribing to:', tierId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground mt-2">Choose the plan that works best for you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subscriptionTiers.map((tier) => {
          const Icon = tier.icon;
          const isActive = currentSubscription === tier.id;
          
          return (
            <Card key={tier.id} className={`relative ${tier.popular ? 'border-primary shadow-lg' : ''} ${isActive ? 'ring-2 ring-primary' : ''}`}>
              {tier.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              {isActive && (
                <Badge variant="secondary" className="absolute -top-2 right-4">
                  Current Plan
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10 w-fit">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    ${tier.price.monthly}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  {tier.price.annual > 0 && (
                    <div className="text-sm text-muted-foreground">
                      or ${tier.price.annual}/year (save ${(tier.price.monthly * 12 - tier.price.annual).toFixed(2)})
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  variant={isActive ? 'secondary' : tier.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={isActive}
                >
                  {isActive ? 'Current Plan' : `Choose ${tier.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Subscription Details */}
      {currentSubscription !== 'FREE' && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Plan</Label>
                <p className="text-lg font-semibold">Hobbyist</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Next Billing Date</Label>
                <p>January 15, 2025</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant="secondary">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

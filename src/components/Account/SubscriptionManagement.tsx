
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Check, Crown, Zap, Star, Sparkles } from 'lucide-react';

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
  gradient: string;
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
    icon: Star,
    gradient: 'from-gray-400 to-gray-600'
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
    popular: true,
    gradient: 'from-blue-500 to-purple-600'
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
    icon: Crown,
    gradient: 'from-purple-500 to-pink-600'
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
    icon: Sparkles,
    gradient: 'from-orange-500 to-red-600'
  }
];

export const SubscriptionManagement = () => {
  const currentSubscription = 'FREE'; // This should come from API or context

  const handleSubscribe = (tierId: string) => {
    // TODO: Implement subscription logic
    console.log('Subscribing to:', tierId);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock your writing potential with the perfect plan for your creative journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {subscriptionTiers.map((tier, index) => {
          const Icon = tier.icon;
          const isActive = currentSubscription === tier.id;
          
          return (
            <Card 
              key={tier.id} 
              className={`relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                tier.popular ? 'border-2 border-primary shadow-xl scale-105' : 'border border-border/50'
              } ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''} 
              animate-fade-in group cursor-pointer`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
              
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1 text-sm font-semibold shadow-lg">
                    🔥 Most Popular
                  </Badge>
                </div>
              )}
              
              {isActive && (
                <div className="absolute -top-3 right-4 z-10">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold shadow-lg">
                    ✨ Current Plan
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6 pt-8 relative z-10">
                <div className={`mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br ${tier.gradient} w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                
                <CardTitle className="text-2xl font-bold mb-2">{tier.name}</CardTitle>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${tier.price.monthly}</span>
                    <span className="text-lg text-muted-foreground">/month</span>
                  </div>
                  
                  {tier.price.annual > 0 && (
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded-full px-3 py-1 inline-block">
                      or ${tier.price.annual}/year 
                      <span className="text-green-600 font-semibold ml-1">
                        (save ${(tier.price.monthly * 12 - tier.price.annual).toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
                
                <p className="text-muted-foreground leading-relaxed">{tier.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-6 relative z-10">
                <ul className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li 
                      key={featureIndex} 
                      className="flex items-start space-x-3 opacity-0 animate-fade-in"
                      style={{ animationDelay: `${(index * 100) + (featureIndex * 50)}ms`, animationFillMode: 'forwards' }}
                    >
                      <div className={`bg-gradient-to-br ${tier.gradient} p-1 rounded-full flex-shrink-0 mt-0.5`}>
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
                    isActive 
                      ? 'bg-green-100 text-green-800 cursor-default' 
                      : tier.popular 
                        ? `bg-gradient-to-r ${tier.gradient} hover:shadow-lg text-white border-0` 
                        : 'hover:scale-105'
                  }`}
                  variant={isActive ? 'secondary' : tier.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={isActive}
                >
                  {isActive ? (
                    <>✨ Current Plan</>
                  ) : (
                    <>
                      {tier.popular ? '🚀 ' : ''}Choose {tier.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Subscription Details */}
      {currentSubscription !== 'FREE' && (
        <Card className="bg-gradient-to-r from-primary/5 to-purple-600/5 border-primary/20 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Current Subscription Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Plan</Label>
                <p className="text-xl font-bold text-primary">Hobbyist</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Next Billing Date</Label>
                <p className="text-lg font-semibold">January 15, 2025</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                  ✅ Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

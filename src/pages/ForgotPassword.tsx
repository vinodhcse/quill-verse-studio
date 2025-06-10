
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, PenTool } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Password reset request for:', email);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-center mb-8">
              <Link to="/" className="flex items-center space-x-2 hover-scale">
                <PenTool className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">AuthorStudio</span>
              </Link>
            </div>

            <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm hover-scale">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100/80 backdrop-blur-sm flex items-center justify-center pulse-glow">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl gradient-animate bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Check your email
                </CardTitle>
                <CardDescription>
                  We've sent a password reset link to {email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive the email? Check your spam folder or{' '}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-primary hover:text-primary/80"
                    onClick={() => setIsSubmitted(false)}
                  >
                    try again
                  </Button>
                </p>
                <Button asChild className="w-full pulse-glow hover-scale">
                  <Link to="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-primary/3 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center justify-center mb-8">
            <Link to="/" className="flex items-center space-x-2 hover-scale">
              <PenTool className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">AuthorStudio</span>
            </Link>
          </div>

          <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm hover-scale">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl gradient-animate bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Forgot password?
              </CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 backdrop-blur-sm border-muted hover:border-primary/50 focus:border-primary transition-all duration-300"
                    required
                  />
                </div>
                <Button type="submit" className="w-full pulse-glow hover-scale">
                  Send reset link
                </Button>
              </form>
              
              <Button asChild variant="ghost" className="w-full hover-scale">
                <Link to="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

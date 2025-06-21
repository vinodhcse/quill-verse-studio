import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Eye, EyeOff, PenTool } from 'lucide-react';
import { login } from '@/lib/api';
import { invoke } from '@tauri-apps/api/tauri';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Explicitly prevent default form submission
    try {
      const data = await login(email, password);
      console.log('Login successful:', data);

      // Set the user role based on login response
      const userRole = data.role; // Assume the API returns a `role` field

      // Call the Tauri backend to set the user role and assign capabilities
      await invoke('login_user', { username: email, password });

      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setErrorMessage(error.response?.data?.message || 'Unauthorized access. Please check your credentials.');
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google login');
    // Navigate to dashboard after successful Google login
    navigate('/dashboard');
  };

  const handleFacebookLogin = () => {
    console.log('Facebook login');
    // Navigate to dashboard after successful Facebook login
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/8 to-accent/8 rounded-full blur-3xl animate-pulse floating" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-accent/6 to-secondary/6 rounded-full blur-3xl animate-pulse floating-delayed" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-primary/4 to-accent/4 rounded-full blur-2xl animate-pulse floating" style={{ animationDelay: '4s' }} />
        
        {/* Additional floating particles */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-primary/3 rounded-full blur-xl floating" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-accent/4 rounded-full blur-xl floating-delayed" style={{ animationDelay: '3s' }} />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,_rgb(255,255,255)_1px,_transparent_0)] bg-[length:40px_40px]" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Link to="/" className="flex items-center space-x-2 hover-scale group">
              <div className="relative">
                <PenTool className="h-8 w-8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AuthorStudio
              </span>
            </Link>
          </div>

          <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm hover-scale group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="space-y-1 text-center relative z-10">
              <CardTitle className="text-2xl gradient-animate bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome back
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to your account to continue writing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={handleGoogleLogin} className="hover-scale group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <svg className="mr-2 h-4 w-4 relative z-10" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="relative z-10">Google</span>
                </Button>
                <Button variant="outline" onClick={handleFacebookLogin} className="hover-scale group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <svg className="mr-2 h-4 w-4 relative z-10" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="relative z-10">Facebook</span>
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-background/50 backdrop-blur-sm border-muted hover:border-primary/50 focus:border-primary transition-all duration-300 group-hover:shadow-md group-hover:shadow-primary/10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-background/50 backdrop-blur-sm border-muted hover:border-primary/50 focus:border-primary transition-all duration-300 group-hover:shadow-md group-hover:shadow-primary/10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-primary/10 transition-all duration-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 transition-colors hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Ensure error message is displayed */}
                {errorMessage && (
                  <div className="text-red-500 text-sm text-center mt-2">
                    {errorMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  onClick={handleLogin}
                  className="w-full pulse-glow hover-scale group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent transition-transform duration-300 group-hover:scale-105" />
                  <span className="relative z-10">Sign In</span>
                </Button>
              </form>
              
              <div className="text-center text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:text-primary/80 transition-colors hover:underline">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;

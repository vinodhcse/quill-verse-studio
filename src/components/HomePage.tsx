
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PenTool, Book, Users, Zap, Check, Star, ArrowRight, Play, Sparkles, Target, Shield } from 'lucide-react';

const HomePage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const features = [
    {
      icon: PenTool,
      title: "Advanced Writing Tools",
      description: "Distraction-free editor with smart formatting, grammar checking, and writing analytics.",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: Book,
      title: "Chapter Management",
      description: "Organize your manuscript with intuitive chapter structure and seamless navigation.",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Work with editors, beta readers, and co-authors in real-time with live editing.",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: Zap,
      title: "AI-Powered Assistance",
      description: "Get writing suggestions, plot ideas, and character development insights from AI.",
      gradient: "from-yellow-500 to-orange-600"
    }
  ];

  const comparisonData = [
    {
      feature: "Distraction-free Writing",
      authorStudio: true,
      atticus: true,
      vellum: false
    },
    {
      feature: "Real-time Collaboration",
      authorStudio: true,
      atticus: false,
      vellum: false
    },
    {
      feature: "AI Writing Assistant",
      authorStudio: true,
      atticus: false,
      vellum: false
    },
    {
      feature: "Advanced Formatting",
      authorStudio: true,
      atticus: true,
      vellum: true
    },
    {
      feature: "Multi-format Export",
      authorStudio: true,
      atticus: true,
      vellum: true
    },
    {
      feature: "Version Control",
      authorStudio: true,
      atticus: false,
      vellum: false
    },
    {
      feature: "Cloud Sync",
      authorStudio: true,
      atticus: true,
      vellum: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Interactive Background */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x / 50}px, ${mousePosition.y / 50}px) translateY(${scrollY / 10}px)`,
            left: '10%',
            top: '20%',
          }}
        />
        <div 
          className="absolute w-80 h-80 bg-gradient-to-r from-secondary/30 to-primary/30 rounded-full blur-3xl transition-transform duration-1200 ease-out"
          style={{
            transform: `translate(${mousePosition.x / -30}px, ${mousePosition.y / -30}px) translateY(${scrollY / 15}px)`,
            right: '10%',
            top: '40%',
          }}
        />
        <div 
          className="absolute w-64 h-64 bg-gradient-to-r from-accent/25 to-secondary/25 rounded-full blur-3xl transition-transform duration-1500 ease-out"
          style={{
            transform: `translate(${mousePosition.x / 40}px, ${mousePosition.y / 40}px) translateY(${scrollY / 8}px)`,
            left: '50%',
            bottom: '20%',
          }}
        />
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center z-10">
        <div className="container mx-auto px-6 text-center animate-on-scroll">
          <div className="relative">
            <Badge variant="secondary" className="mb-6 animate-scale-in bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <Sparkles className="w-4 h-4 mr-2" />
              ✨ The Future of Writing is Here
            </Badge>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent relative">
              AuthorStudio
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 blur-2xl -z-10 animate-pulse" />
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              The most powerful writing platform for authors, with AI assistance, real-time collaboration, 
              and professional publishing tools all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 py-6 hover-scale group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 transition-transform duration-300 group-hover:scale-105" />
                <Link to="/signup" className="flex items-center relative z-10">
                  Start Writing Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 hover-scale group backdrop-blur-sm">
                <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                Watch Demo
              </Button>
            </div>
            
            {/* Enhanced Stats with floating animation */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              {[
                { value: '50K+', label: 'Active Writers', delay: '0s' },
                { value: '1M+', label: 'Words Written', delay: '0.2s' },
                { value: '100+', label: 'Published Books', delay: '0.4s' }
              ].map((stat, index) => (
                <div 
                  key={index} 
                  className="animate-on-scroll relative group"
                  style={{ animationDelay: stat.delay }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg blur-xl group-hover:blur-2xl transition-all duration-300" />
                  <div className="relative p-4 rounded-lg backdrop-blur-sm border border-primary/10 group-hover:border-primary/20 transition-all duration-300">
                    <div className="text-3xl font-bold text-primary group-hover:scale-110 transition-transform duration-300">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-24 bg-muted/50 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Everything you need to write your masterpiece
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From first draft to final publication, AuthorStudio provides all the tools 
              you need to bring your story to life.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="animate-on-scroll hover-scale group relative overflow-hidden border-0 bg-background/50 backdrop-blur-sm" 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                <CardContent className="p-6 text-center relative z-10">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section with enhanced styling */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <Badge variant="outline" className="mb-4">
              <Target className="w-4 h-4 mr-2" />
              Feature Comparison
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How we compare to the competition
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See why AuthorStudio is the preferred choice for serious writers
            </p>
          </div>

          <div className="max-w-4xl mx-auto animate-on-scroll">
            <Card className="overflow-hidden border-0 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-primary/5 to-accent/5">
                      <tr className="border-b border-primary/10">
                        <th className="text-left p-6 font-semibold">Feature</th>
                        <th className="text-center p-6 font-semibold text-primary relative">
                          <div className="flex items-center justify-center">
                            <Shield className="w-4 h-4 mr-2" />
                            AuthorStudio
                          </div>
                        </th>
                        <th className="text-center p-6 font-semibold">Atticus</th>
                        <th className="text-center p-6 font-semibold">Vellum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, index) => (
                        <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                          <td className="p-6 font-medium">{row.feature}</td>
                          <td className="text-center p-6">
                            {row.authorStudio ? (
                              <div className="flex items-center justify-center">
                                <Check className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="text-center p-6">
                            {row.atticus ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="text-center p-6">
                            {row.vellum ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-24 bg-muted/50 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Loved by writers worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                text: "AuthorStudio has revolutionized my writing process. The collaboration features and AI assistance have helped me finish my novel faster than ever before.",
                author: "Jane Smith",
                role: "Best-selling Author",
                avatar: "JS"
              },
              {
                text: "The distraction-free environment and powerful formatting tools make AuthorStudio my go-to choice for all my writing projects.",
                author: "Mike Johnson",
                role: "Indie Author",
                avatar: "MJ"
              },
              {
                text: "Real-time collaboration with my editor has never been easier. AuthorStudio streamlined our entire workflow.",
                author: "Sarah Davis",
                role: "Fiction Writer",
                avatar: "SD"
              }
            ].map((testimonial, index) => (
              <Card 
                key={index} 
                className="animate-on-scroll hover-scale group relative overflow-hidden border-0 bg-background/50 backdrop-blur-sm" 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform" style={{ transitionDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <span className="text-sm font-medium">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <div className="font-medium">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-6 text-center animate-on-scroll">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 blur-3xl -z-10" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ready to write your next bestseller?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of authors who trust AuthorStudio to bring their stories to life.
            </p>
            <Button size="lg" className="text-lg px-8 py-6 hover-scale group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent transition-transform duration-300 group-hover:scale-105" />
              <Link to="/signup" className="flex items-center relative z-10">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

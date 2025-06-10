
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PenTool, Book, Users, Zap, Check, Star, ArrowRight, Play } from 'lucide-react';

const HomePage = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: PenTool,
      title: "Advanced Writing Tools",
      description: "Distraction-free editor with smart formatting, grammar checking, and writing analytics."
    },
    {
      icon: Book,
      title: "Chapter Management",
      description: "Organize your manuscript with intuitive chapter structure and seamless navigation."
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Work with editors, beta readers, and co-authors in real-time with live editing."
    },
    {
      icon: Zap,
      title: "AI-Powered Assistance",
      description: "Get writing suggestions, plot ideas, and character development insights from AI."
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 animate-pulse" />
        
        {/* 3D Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-accent/20 rounded-full blur-xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-secondary/20 rounded-full blur-xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }} />
        </div>

        <div className="container mx-auto px-6 text-center animate-on-scroll">
          <Badge variant="secondary" className="mb-6 animate-scale-in">
            ✨ The Future of Writing is Here
          </Badge>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            AuthorStudio
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The most powerful writing platform for authors, with AI assistance, real-time collaboration, 
            and professional publishing tools all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-6 hover-scale">
              <Link to="/signup" className="flex items-center">
                Start Writing Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 hover-scale">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="animate-on-scroll">
              <div className="text-3xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Active Writers</div>
            </div>
            <div className="animate-on-scroll" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl font-bold text-primary">1M+</div>
              <div className="text-sm text-muted-foreground">Words Written</div>
            </div>
            <div className="animate-on-scroll" style={{ animationDelay: '0.4s' }}>
              <div className="text-3xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground">Published Books</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything you need to write your masterpiece
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From first draft to final publication, AuthorStudio provides all the tools 
              you need to bring your story to life.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="animate-on-scroll hover-scale group" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How we compare to the competition
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See why AuthorStudio is the preferred choice for serious writers
            </p>
          </div>

          <div className="max-w-4xl mx-auto animate-on-scroll">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-6 font-semibold">Feature</th>
                        <th className="text-center p-6 font-semibold text-primary">AuthorStudio</th>
                        <th className="text-center p-6 font-semibold">Atticus</th>
                        <th className="text-center p-6 font-semibold">Vellum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-6 font-medium">{row.feature}</td>
                          <td className="text-center p-6">
                            {row.authorStudio ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
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

      {/* Testimonials Section */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Loved by writers worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((index) => (
              <Card key={index} className="animate-on-scroll hover-scale" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "AuthorStudio has revolutionized my writing process. The collaboration features 
                    and AI assistance have helped me finish my novel faster than ever before."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium">JS</span>
                    </div>
                    <div>
                      <div className="font-medium">Jane Smith</div>
                      <div className="text-sm text-muted-foreground">Best-selling Author</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6 text-center animate-on-scroll">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to write your next bestseller?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of authors who trust AuthorStudio to bring their stories to life.
          </p>
          <Button size="lg" className="text-lg px-8 py-6 hover-scale">
            <Link to="/signup" className="flex items-center">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

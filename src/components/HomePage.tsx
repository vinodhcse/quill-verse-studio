import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { 
  PenTool, Book, Users, Zap, Check, Star, ArrowRight, Play, Sparkles, Target, Shield,
  FileText, Brain, RefreshCw, Edit3, GitBranch, BarChart3, MessageSquare, Eye,
  Mic, Headphones, Download, Palette, Smartphone, Lock, UserCheck, Fingerprint,
  AlertTriangle, FileShield
} from 'lucide-react';

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

  // Comprehensive feature set for carousel
  const allFeatures = [
    // Writing & Planning Tools
    { icon: FileText, title: "Content Templates", description: "Novel and Screenplay formats with custom UI/UX for each type", category: "Writing" },
    { icon: Brain, title: "Multiple Planning Boards", description: "Modular boards for Plot, Logic, Character Arcs, and World-building", category: "Planning" },
    { icon: RefreshCw, title: "Auto Board Sync", description: "Planning boards automatically update based on written chapters", category: "Planning" },
    { icon: Edit3, title: "Rich Text Editor", description: "Section/chapter split, formatting tools, linked to planning boards", category: "Writing" },
    { icon: Zap, title: "AI Assistance", description: "Grammar, paraphrasing, and idea generation with open-source AI", category: "AI" },
    { icon: GitBranch, title: "Version Control", description: "Git-style branching, draft comparison, and edition tagging", category: "Organization" },
    { icon: BarChart3, title: "Chapter Metrics", description: "Word count, reading time, and character POV stats per chapter", category: "Analytics" },
    
    // Collaboration Tools
    { icon: Users, title: "Multi-user Editing", description: "Real-time collaborative editing with role-based access controls", category: "Collaboration" },
    { icon: Edit3, title: "Suggestion Mode", description: "Editors suggest changes that are tracked and reviewed by authors", category: "Collaboration" },
    { icon: MessageSquare, title: "Commenting System", description: "Inline and section comments with threaded discussions", category: "Collaboration" },
    { icon: Eye, title: "Line-Level Tracking", description: "See who changed what line and when with detailed history", category: "Collaboration" },
    { icon: UserCheck, title: "Role-Based Access", description: "Authors, Co-Writers, Editors, Formatters, and Reviewers with specific permissions", category: "Security" },
    
    // Speech-to-Text Support
    { icon: Mic, title: "Local Dictation", description: "In-browser speech recognition for hands-free writing", category: "Accessibility" },
    { icon: Headphones, title: "Live Correction", description: "AI-assisted grammar correction as you dictate", category: "AI" },
    
    // Formatting & Publishing
    { icon: Download, title: "Multi-Format Export", description: "PDF, DOCX, EPUB, MOBI, and print-ready layouts", category: "Publishing" },
    { icon: Palette, title: "Formatting Themes", description: "Customize typography, layout, spacing, and scene breaks", category: "Design" },
    { icon: Smartphone, title: "Preview per Device", description: "See how your book appears on Kindle, tablet, print, etc.", category: "Design" },
    
    // Security & Privacy
    { icon: Shield, title: "Anti-Copy Protection", description: "Disable right-click, copy commands, and selection for reviewers", category: "Security" },
    { icon: Lock, title: "End-to-End Encryption", description: "Secure file storage with encrypted collaboration streams", category: "Security" },
    { icon: UserCheck, title: "Granular Sharing", description: "Control who sees what, with expiration dates for access", category: "Security" },
    { icon: Fingerprint, title: "Session Watermarking", description: "Track document access with user-specific watermarks", category: "Security" }
  ];

  const securityFeatures = [
    {
      icon: Shield,
      title: "Your Work Stays Protected",
      description: "We prevent unauthorized copying with built-in protection that disables common ways people might try to steal your content, like right-clicking or copy-paste commands.",
      benefits: ["No more worry about content theft", "Professional-grade protection", "Works automatically in the background"]
    },
    {
      icon: Lock,
      title: "Bank-Level Security",
      description: "Your manuscripts are encrypted using the same technology banks use. Only you and people you specifically authorize can read your work.",
      benefits: ["Your ideas remain confidential", "Secure even during collaboration", "No unauthorized access possible"]
    },
    {
      icon: UserCheck,
      title: "You Control Who Sees What",
      description: "Give different people different levels of access. Your editor might see everything, while a beta reader only sees specific chapters. You can even set expiration dates.",
      benefits: ["Precise control over your work", "Time-limited access options", "Role-based permissions"]
    },
    {
      icon: Fingerprint,
      title: "Track Any Leaks",
      description: "If someone shares your work without permission, our invisible watermarking helps you trace where it came from, protecting you legally.",
      benefits: ["Legal protection evidence", "Invisible to readers", "Peace of mind when sharing"]
    },
    {
      icon: FileShield,
      title: "No Downloads, No Risk",
      description: "Reviewers and editors work directly in our secure platform. They can't download your entire book, reducing the risk of unauthorized distribution.",
      benefits: ["Complete manuscript protection", "Collaborative editing without risk", "Professional review process"]
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
      feature: "Advanced Copy Protection",
      authorStudio: true,
      atticus: false,
      vellum: false
    },
    {
      feature: "End-to-End Encryption",
      authorStudio: true,
      atticus: false,
      vellum: false
    },
    {
      feature: "Session Watermarking",
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
      {/* Enhanced Interactive Background */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl transition-transform duration-1000 ease-out floating"
          style={{
            transform: `translate(${mousePosition.x / 50}px, ${mousePosition.y / 50}px) translateY(${scrollY / 10}px)`,
            left: '10%',
            top: '20%',
          }}
        />
        <div 
          className="absolute w-80 h-80 bg-gradient-to-r from-secondary/30 to-primary/30 rounded-full blur-3xl transition-transform duration-1200 ease-out floating-delayed"
          style={{
            transform: `translate(${mousePosition.x / -30}px, ${mousePosition.y / -30}px) translateY(${scrollY / 15}px)`,
            right: '10%',
            top: '40%',
          }}
        />
        <div 
          className="absolute w-64 h-64 bg-gradient-to-r from-accent/25 to-secondary/25 rounded-full blur-3xl transition-transform duration-1500 ease-out floating"
          style={{
            transform: `translate(${mousePosition.x / 40}px, ${mousePosition.y / 40}px) translateY(${scrollY / 8}px)`,
            left: '50%',
            bottom: '20%',
          }}
        />
        
        {/* Additional floating particles */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-primary/10 rounded-full blur-xl floating" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-accent/15 rounded-full blur-xl floating-delayed" style={{ animationDelay: '3s' }} />
        <div className="absolute top-3/4 right-1/3 w-20 h-20 bg-secondary/20 rounded-full blur-lg floating" style={{ animationDelay: '5s' }} />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,_rgb(255,255,255)_1px,_transparent_0)] bg-[length:40px_40px]" />
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
            
            {/* Enhanced Stats */}
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

      {/* Comprehensive Features Carousel */}
      <section className="py-24 bg-muted/50 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <Badge variant="outline" className="mb-4 border-green-500/20 text-green-600">
              <Sparkles className="w-4 h-4 mr-2" />
              Complete Feature Set
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Everything you need in one platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From writing and planning to collaboration and publishing, explore all the features 
              that make AuthorStudio the complete solution for authors.
            </p>
          </div>

          <div className="animate-on-scroll">
            <Carousel className="w-full max-w-5xl mx-auto">
              <CarouselContent className="-ml-2 md:-ml-4">
                {allFeatures.map((feature, index) => (
                  <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="hover-scale group relative overflow-hidden border-0 bg-background/50 backdrop-blur-sm h-full">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CardContent className="p-6 text-center relative z-10 h-full flex flex-col justify-between">
                        <div>
                          <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <feature.icon className="h-6 w-6 text-primary" />
                          </div>
                          <Badge variant="secondary" className="mb-2 text-xs">
                            {feature.category}
                          </Badge>
                          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Security & Privacy Section - Author-Friendly */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <Badge variant="outline" className="mb-4 border-green-500/20 text-green-600">
              <Shield className="w-4 h-4 mr-2" />
              Your Work is Protected
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Share confidently, never worry about theft
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              As an author, your intellectual property is your livelihood. We've built industry-leading 
              protection so you can collaborate freely without fear of your work being stolen or leaked.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {securityFeatures.map((feature, index) => (
              <Card 
                key={index} 
                className="animate-on-scroll hover-scale group relative overflow-hidden border-0 bg-background/50 backdrop-blur-sm" 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-6 relative z-10">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-center group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-center leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12 animate-on-scroll">
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl p-8 border border-green-500/20">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Why This Matters for Authors</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Every year, authors lose thousands of dollars from unauthorized copying and distribution. 
                With AuthorStudio's protection, you can collaborate with editors, beta readers, and co-authors 
                while maintaining complete control over your intellectual property.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Comparison Section */}
      <section className="py-24 bg-muted/50 relative z-10">
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
              See why AuthorStudio is the preferred choice for serious writers who value both functionality and security
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
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Loved by writers worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                text: "AuthorStudio's security features gave me peace of mind when sharing my manuscript with beta readers. The copy protection and watermarking meant I could get feedback without worrying about leaks.",
                author: "Jane Smith",
                role: "Best-selling Author",
                avatar: "JS"
              },
              {
                text: "The collaboration tools are incredible. My editor and I can work together in real-time, and I love that I can control exactly what each person can access.",
                author: "Mike Johnson",
                role: "Indie Author",
                avatar: "MJ"
              },
              {
                text: "Finally, a writing platform that understands authors need both powerful tools AND protection. The anti-copy measures are a game-changer for manuscript security.",
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
              Join thousands of authors who trust AuthorStudio to bring their stories to life—safely and securely.
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

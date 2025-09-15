import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePublicData } from "@/hooks/usePublicData";
import { HeroFilter } from "@/components/ui/HeroFilter";
import { 
  Wrench, 
  Sparkles, 
  Truck, 
  Scissors, 
  PaintBucket, 
  Laptop,
  Star,
  Shield,
  Clock,
  Users,
  Search,
  MapPin,
  FileText,
  CheckCircle
} from "lucide-react";
import heroImage from "@/assets/hero-services.jpg";

const Index = () => {
  const { loading, stats, categories } = usePublicData();

  // Icon mapping for categories
  const getIconForCategory = (categoryName: string) => {
    switch (categoryName?.toLowerCase()) {
      case 'cleaning': return Sparkles;
      case 'handyman': return Wrench;
      case 'moving': return Truck;
      case 'personal care': return Scissors;
      case 'painting': return PaintBucket;
      case 'tech support': return Laptop;
      default: return Wrench;
    }
  };

  // Use dynamic data if available, fallback to default
  const serviceCategories = categories.length > 0 ? categories.map(category => ({
    icon: getIconForCategory(category.name),
    title: category.name,
    description: category.description || `Professional ${category.name.toLowerCase()} services`,
    workers: category.workers,
    avgPrice: `$${category.avgPrice.min}-${category.avgPrice.max}`,
  })) : [
    {
      icon: Sparkles,
      title: "Cleaning",
      description: "Professional house cleaning services",
      workers: 150,
      avgPrice: "$50-80",
    },
    {
      icon: Wrench,
      title: "Handyman",
      description: "Home repairs and maintenance",
      workers: 200,
      avgPrice: "$60-100",
    },
    {
      icon: Truck,
      title: "Moving",
      description: "Professional moving services",
      workers: 75,
      avgPrice: "$80-150",
    },
    {
      icon: Scissors,
      title: "Personal Care",
      description: "Beauty and wellness services",
      workers: 120,
      avgPrice: "$40-120",
    },
    {
      icon: PaintBucket,
      title: "Painting",
      description: "Interior and exterior painting",
      workers: 90,
      avgPrice: "$70-200",
    },
    {
      icon: Laptop,
      title: "Tech Support",
      description: "Computer and tech assistance",
      workers: 80,
      avgPrice: "$50-90",
    },
  ];

  const platformStats = [
    { icon: Users, value: `${Math.floor(stats.totalCustomers / 1000)}k+`, label: "Happy Customers" },
    { icon: Star, value: `${stats.averageRating}/5`, label: "Average Rating" },
    { icon: Shield, value: `${stats.verifiedWorkers}%`, label: "Verified Workers" },
    { icon: Clock, value: "24/7", label: "Support Available" },
  ];

  const handleHeroSearch = (serviceCategory: string, location: string) => {
    console.log('Hero search:', { serviceCategory, location });
    
    // You can implement navigation to a search results page here
    // For example:
    // navigate(`/search?category=${encodeURIComponent(serviceCategory)}&location=${encodeURIComponent(location)}`);
    
    // Or show a toast notification
    // toast({
    //   title: "Search initiated",
    //   description: `Searching for ${serviceCategory} workers in ${location}`,
    // });
    
    // For now, we'll just log the search parameters
    // In a real implementation, you would:
    // 1. Navigate to a search results page
    // 2. Pass the search parameters as query params
    // 3. Use those parameters to filter workers from the database
    // 4. Display the filtered results
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-white to-primary/10 py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2">
                  Trusted by {Math.floor(stats.totalCustomers / 1000)}k+ customers
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Get things done with{" "}
                  <span className="bg-gradient-to-r from-primary to-[hsl(255,85%,62%)] bg-clip-text text-transparent">
                    trusted workers
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  From cleaning and handyman services to moving and tech support, 
                  find skilled professionals in your area ready to help.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="btn-hero text-lg" asChild>
                  <Link to="/services">Browse Services</Link>
                </Button>
                <Button variant="outline" className="btn-hero-outline text-lg" asChild>
                  <Link to="/become-worker">Become a Worker</Link>
                </Button>
              </div>

         
            </div>

            <div className="relative">
              <img 
                src={heroImage} 
                alt="Professional workers providing various services" 
                className="rounded-3xl shadow-2xl w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Background Checked</p>
                    <p className="text-sm text-muted-foreground">All workers verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Filter Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-foreground">Find Your Perfect Worker</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your service and location to discover skilled professionals in your area
            </p>
          </div>
          
          <HeroFilter onSearch={handleHeroSearch} />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {platformStats.map((stat, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Simple & Easy
            </div>
            <h2 className="text-5xl font-bold text-foreground leading-tight">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Get the help you need in just a few simple steps. Our streamlined process makes finding and hiring skilled workers effortless.
            </p>
            <div className="pt-4">
              <Button variant="outline" className="text-lg px-6 py-2" asChild>
                <Link to="/how-it-works">Learn More About Our Process</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: "1",
                title: "Describe Your Task",
                description: "Tell us what you need done and when you need it. Be as specific as possible to get the best matches.",
                icon: FileText,
                color: "from-blue-500 to-blue-600",
                bgColor: "from-blue-50 to-blue-100",
                borderColor: "border-blue-200",
                shadowColor: "shadow-blue-100"
              },
              {
                step: "2",
                title: "Choose Your Worker",
                description: "Browse verified profiles, read reviews, and compare prices to find the perfect professional for your needs.",
                icon: Users,
                color: "from-purple-500 to-purple-600",
                bgColor: "from-purple-50 to-purple-100",
                borderColor: "border-purple-200",
                shadowColor: "shadow-purple-100"
              },
              {
                step: "3",
                title: "Get It Done",
                description: "Your chosen worker will complete the task efficiently and professionally. Sit back and enjoy the results!",
                icon: CheckCircle,
                color: "from-green-500 to-green-600",
                bgColor: "from-green-50 to-green-100",
                borderColor: "border-green-200",
                shadowColor: "shadow-green-100"
              },
            ].map((step, index) => (
              <div key={index} className="group relative">
                {/* Connection Line */}
                {index < 2 && (
                  <div className="hidden lg:block absolute top-8 left-full w-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 z-0"></div>
                )}
                
                {/* Main Card */}
                <div className={`relative bg-gradient-to-br ${step.bgColor} border ${step.borderColor} rounded-3xl p-8 text-center transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl ${step.shadowColor} hover:shadow-xl`}>
                                    {/* Floating Icon */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  {/* Step Number */}
                  <div className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <span className="text-3xl font-bold text-white">{step.step}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-foreground leading-tight">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-base">{step.description}</p>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-r from-white/20 to-white/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-4 left-4 w-2 h-2 bg-gradient-to-r from-white/20 to-white/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: Shield,
                title: "Verified Workers",
                description: "All professionals are background-checked and verified"
              },
              {
                icon: Star,
                title: "Top Rated",
                description: "Choose from highly-rated and reviewed workers"
              },
              {
                icon: Clock,
                title: "Quick Service",
                description: "Get help within hours, not days"
              },
              {
                icon: Users,
                title: "Local Experts",
                description: "Find skilled workers in your neighborhood"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-foreground mb-4">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6">
                Join thousands of satisfied customers who have found their perfect worker through our platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="btn-hero text-lg px-8 py-3" asChild>
                  <Link to="/signup">Get Started Today</Link>
                </Button>
                <Button variant="outline" className="text-lg px-8 py-3" asChild>
                  <Link to="/services">Browse Services</Link>
                </Button>
                <Button variant="outline" className="text-lg px-8 py-3" asChild>
                  <Link to="/how-it-works">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

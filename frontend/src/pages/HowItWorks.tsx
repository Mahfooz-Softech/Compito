import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Sparkles, 
  Shield, 
  Star, 
  Clock, 
  MapPin,
  Phone,
  MessageSquare,
  CreditCard,
  Award,
  Zap,
  Heart
} from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      step: "1",
      title: "Describe Your Task",
      description: "Tell us what you need done and when you need it. Be as specific as possible to get the best matches.",
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      shadowColor: "shadow-blue-100",
      details: [
        "Specify the type of service you need",
        "Set your preferred timeline",
        "Add any special requirements",
        "Upload photos if needed"
      ]
    },
    {
      step: "2",
      title: "Choose Your Worker",
      description: "Browse verified profiles, read reviews, and compare prices to find the perfect professional for your needs.",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100",
      borderColor: "border-purple-200",
      shadowColor: "shadow-purple-100",
      details: [
        "View verified worker profiles",
        "Read customer reviews and ratings",
        "Compare pricing and availability",
        "Check worker qualifications"
      ]
    },
    {
      step: "3",
      title: "Get It Done",
      description: "Your chosen worker will complete the task efficiently and professionally. Sit back and enjoy the results!",
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      shadowColor: "shadow-green-100",
      details: [
        "Worker arrives on time",
        "Professional service delivery",
        "Quality assurance check",
        "Secure payment processing"
      ]
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Verified Workers",
      description: "All professionals are background-checked and verified for your safety"
    },
    {
      icon: Star,
      title: "Top Rated",
      description: "Choose from highly-rated and reviewed workers in your area"
    },
    {
      icon: Clock,
      title: "Quick Service",
      description: "Get help within hours, not days - we value your time"
    },
    {
      icon: MapPin,
      title: "Local Experts",
      description: "Find skilled workers right in your neighborhood"
    },
    {
      icon: Phone,
      title: "24/7 Support",
      description: "Round-the-clock customer support whenever you need help"
    },
    {
      icon: MessageSquare,
      title: "Easy Communication",
      description: "Chat directly with workers through our secure messaging system"
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Safe and secure payment processing with multiple options"
    },
    {
      icon: Award,
      title: "Quality Guarantee",
      description: "We stand behind every service with our satisfaction guarantee"
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Find and book workers in minutes, not hours"
    },
    {
      icon: Heart,
      title: "Trusted Platform",
      description: "Join thousands of satisfied customers who trust our service"
    },
    {
      icon: Sparkles,
      title: "Premium Quality",
      description: "Only the best workers make it to our platform"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Simple & Easy Process
            </div>
            <h1 className="text-6xl font-bold text-foreground leading-tight">
              How It Works
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Get the help you need in just a few simple steps. Our streamlined process makes finding and hiring skilled workers effortless and enjoyable.
            </p>
          </div>
        </div>
      </section>

      {/* Main Steps Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {steps.map((step, index) => (
              <div key={index} className="group relative">
                {/* Connection Line */}
                {index < 2 && (
                  <div className="hidden lg:block absolute top-8 left-full w-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 z-0"></div>
                )}
                
                {/* Main Card */}
                <Card className={`relative bg-gradient-to-br ${step.bgColor} border ${step.borderColor} rounded-3xl p-8 text-center transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl ${step.shadowColor} hover:shadow-xl h-full`}>
                  <CardContent className="p-0">
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
                    <div className="space-y-4 mb-6">
                      <h3 className="text-2xl font-bold text-foreground leading-tight">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-base">{step.description}</p>
                    </div>

                    {/* Step Details */}
                    <div className="space-y-3 text-left">
                      {step.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-start gap-3">
                          <div className={`w-2 h-2 bg-gradient-to-r ${step.color} rounded-full mt-2 flex-shrink-0`}></div>
                          <p className="text-sm text-muted-foreground">{detail}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-r from-white/20 to-white/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute bottom-4 left-4 w-2 h-2 bg-gradient-to-r from-white/20 to-white/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="mb-20">
            <div className="text-center space-y-6 mb-16">
              <h2 className="text-4xl font-bold text-foreground">Why Choose Our Platform?</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We've built a platform that puts your needs first, with features designed to make your experience seamless and enjoyable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mb-20">
            <div className="text-center space-y-6 mb-16">
              <h2 className="text-4xl font-bold text-foreground">The Compito Advantage</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Experience the difference that our platform brings to finding and hiring skilled workers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-3xl p-8 text-center hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <benefit.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-12 max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold text-foreground mb-6">Ready to Get Started?</h3>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied customers who have found their perfect worker through our platform. 
                Start your journey today and experience the difference.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="btn-hero text-lg px-8 py-3" asChild>
                  <Link to="/signup">Get Started Today</Link>
                </Button>
                <Button variant="outline" className="text-lg px-8 py-3" asChild>
                  <Link to="/services">Browse Services</Link>
                </Button>
                <Button variant="outline" className="text-lg px-8 py-3" asChild>
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;




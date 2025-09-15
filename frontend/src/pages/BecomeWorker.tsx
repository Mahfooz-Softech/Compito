import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, DollarSign, Clock, Star } from "lucide-react";

const BecomeWorker = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-r from-primary/5 to-primary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 mb-6">
            Join 10,000+ Workers
          </Badge>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Earn Money with Your Skills
          </h1>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Turn your expertise into income. Set your own schedule, choose your clients, and build your business.
          </p>
          <Button className="btn-hero text-lg mr-4" asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
          <Button variant="outline" className="btn-hero-outline text-lg">
            Learn More
          </Button>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Compito?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: DollarSign, title: "Earn More", desc: "Keep 80% of what you earn" },
              { icon: Clock, title: "Flexible Schedule", desc: "Work when you want" },
              { icon: Users, title: "Quality Clients", desc: "Verified customers only" },
              { icon: Star, title: "Build Reputation", desc: "Grow your rating & reviews" },
            ].map((item, i) => (
              <Card key={i} className="text-center p-6">
                <CardContent className="pt-6">
                  <item.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BecomeWorker;
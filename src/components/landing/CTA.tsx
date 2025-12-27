import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-eco opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl gradient-eco flex items-center justify-center mx-auto mb-8 animate-float">
            <Leaf className="w-10 h-10 text-primary-foreground" />
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Turn Your
            <span className="text-gradient-eco"> Waste Into Wealth?</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of users who are earning crypto rewards while helping save the planet. 
            Download now and start your sustainable journey.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="gradient-eco border-0 text-lg px-10 h-14 hover:opacity-90 transition-opacity eco-glow">
              <Link to="/dashboard">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-10 h-14 bg-card/50 backdrop-blur-sm">
              <Link to="/collector">
                Become a Collector
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • Start earning in minutes
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;

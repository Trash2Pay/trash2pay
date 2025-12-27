import { Smartphone, Truck, Factory, Coins } from "lucide-react";

const steps = [
  {
    icon: Smartphone,
    title: "Request Pickup",
    description: "Schedule a waste pickup from your home or business through our easy-to-use app.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Truck,
    title: "Collector Arrives",
    description: "A verified waste collector picks up your waste and scans the QR code for verification.",
    color: "bg-eco-sky/20 text-eco-sky",
  },
  {
    icon: Factory,
    title: "Processing Plant",
    description: "Waste is delivered to a recycling plant where it's properly processed and recycled.",
    color: "bg-eco-earth/20 text-eco-earth",
  },
  {
    icon: Coins,
    title: "Earn Rewards",
    description: "Receive crypto tokens automatically via smart contract once processing is confirmed.",
    color: "bg-eco-gold/20 text-eco-gold",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6">
            Simple Steps to
            <span className="text-gradient-eco"> Earn Rewards</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From waste to wealth in four easy steps. Our blockchain-powered system ensures 
            transparent and instant reward distribution.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-eco-sky to-eco-gold -translate-y-1/2 rounded-full opacity-20" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full gradient-eco text-primary-foreground text-sm font-bold flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>

                {/* Card */}
                <div className="glass rounded-2xl p-8 pt-10 w-full hover:eco-shadow transition-shadow duration-300">
                  <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

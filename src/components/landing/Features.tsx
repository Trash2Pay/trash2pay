import { Shield, Zap, Globe, Wallet, BarChart3, Users } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Blockchain Verified",
    description: "Every transaction is immutably recorded on the BSV blockchain for complete transparency.",
  },
  {
    icon: Zap,
    title: "Instant Rewards",
    description: "Smart contracts automatically distribute rewards the moment waste processing is confirmed.",
  },
  {
    icon: Globe,
    title: "Environmental Impact",
    description: "Track your personal contribution to reducing landfill waste and carbon emissions.",
  },
  {
    icon: Wallet,
    title: "Crypto Earnings",
    description: "Earn BSV-based tokens that can be traded, saved, or converted to your local currency.",
  },
  {
    icon: BarChart3,
    title: "Real-time Tracking",
    description: "Monitor your pickup status, token balance, and environmental impact in real-time.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Join a growing community of eco-conscious users making a difference together.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6">
            Why Choose
            <span className="text-gradient-eco"> Trash2Pay</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Built on cutting-edge blockchain technology with a focus on user experience and environmental impact.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 hover:eco-shadow"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-2xl gradient-eco flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

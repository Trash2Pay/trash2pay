import { Gift, Trophy, Flame, Star } from "lucide-react";

const rewardTiers = [
  {
    icon: Gift,
    name: "Regular Pickup",
    tokens: "10",
    description: "Earn tokens for every verified waste pickup",
    color: "border-primary/30 bg-primary/5",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    icon: Star,
    name: "Recyclables Bonus",
    tokens: "+5",
    description: "Extra tokens for properly sorted recyclables",
    color: "border-eco-sky/30 bg-eco-sky/5",
    iconBg: "bg-eco-sky/20 text-eco-sky",
  },
  {
    icon: Flame,
    name: "Streak Bonus",
    tokens: "2x",
    description: "Double rewards for 7-day pickup streaks",
    color: "border-eco-gold/30 bg-eco-gold/5",
    iconBg: "bg-eco-gold/20 text-eco-gold",
  },
  {
    icon: Trophy,
    name: "Referral Rewards",
    tokens: "25",
    description: "Tokens for every friend who joins Trash2Pay",
    color: "border-accent/30 bg-accent/5",
    iconBg: "bg-accent/20 text-accent",
  },
];

const Rewards = () => {
  return (
    <section id="rewards" className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Rewards</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6">
            Earn While You
            <span className="text-gradient-eco"> Help the Planet</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Multiple ways to earn tokens. The more you recycle, the more you earn.
          </p>
        </div>

        {/* Reward Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {rewardTiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`group rounded-2xl p-6 border-2 ${tier.color} hover:scale-105 transition-all duration-300`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl ${tier.iconBg} flex items-center justify-center mb-4`}>
                <tier.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {tier.tokens} <span className="text-lg font-medium text-muted-foreground">tokens</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{tier.name}</h3>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
            </div>
          ))}
        </div>

        {/* Token Info */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-8 md:p-12 text-center eco-shadow">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              T2P Units
            </h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Our native token is built on the BSV blockchain, enabling instant, low-cost transactions
              and seamless integration with the broader crypto ecosystem.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">$0.10</div>
                <div className="text-sm text-muted-foreground">Current Value</div>
              </div>
              <div className="w-px h-12 bg-border hidden sm:block" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">1M+</div>
                <div className="text-sm text-muted-foreground">Tokens in Circulation</div>
              </div>
              <div className="w-px h-12 bg-border hidden sm:block" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">Active Holders</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Rewards;

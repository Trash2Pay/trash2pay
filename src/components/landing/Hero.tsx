import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Recycle, Coins, Leaf } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { ConnectWalletModal } from "@/components/wallets/ConnectWalletModal";
import { useState, useEffect } from "react";

const Hero = () => {
  const { isConnected, userRole, isNewUser } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [pendingRole, setPendingRole] = useState<'user' | 'collector' | null>(null);
  const navigate = useNavigate();

  // Handle redirect after wallet connection
  useEffect(() => {
    if (isConnected && isNewUser) {
      navigate('/select-role');
    }
  }, [isConnected, isNewUser, navigate]);

  const handleRoleClick = (role: 'user' | 'collector') => {
    if (isConnected) {
      // Already connected, check if they have a role
      if (userRole) {
        // Already has a role, go to their dashboard
        navigate(userRole === 'user' ? '/dashboard' : '/collector');
      } else {
        // No role yet, go to role selection
        navigate('/select-role');
      }
    } else {
      // Not connected, show wallet modal
      setPendingRole(role);
      setShowWalletModal(true);
    }
  };

  return (
    <section className="relative min-h-screen gradient-hero flex items-center overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-eco-mint/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-24 md:pt-32 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-secondary-foreground">Powered by BSV Blockchain</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 animate-slide-up">
            Turn Your
            <span className="text-gradient-eco"> Trash </span>
            Into
            <span className="text-gradient-eco"> Cash</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Connect with waste collectors, earn crypto rewards, and help save the planet. 
            The decentralized waste management revolution starts here.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button 
              size="lg" 
              className="gradient-eco border-0 text-lg px-8 h-14 hover:opacity-90 transition-opacity eco-glow"
              onClick={() => handleRoleClick('user')}
            >
              Start Earning
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 h-14 bg-card/50 backdrop-blur-sm"
              onClick={() => handleRoleClick('collector')}
            >
              Join as Collector
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="glass rounded-2xl p-6 eco-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Recycle className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">50K+</div>
              <div className="text-sm text-muted-foreground">Pickups Completed</div>
            </div>
            <div className="glass rounded-2xl p-6 eco-shadow">
              <div className="w-12 h-12 rounded-xl bg-eco-gold/20 flex items-center justify-center mx-auto mb-4">
                <Coins className="w-6 h-6 text-eco-gold" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">$125K</div>
              <div className="text-sm text-muted-foreground">Rewards Distributed</div>
            </div>
            <div className="glass rounded-2xl p-6 eco-shadow">
              <div className="w-12 h-12 rounded-xl bg-eco-leaf/20 flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-6 h-6 text-eco-leaf" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">100T</div>
              <div className="text-sm text-muted-foreground">CO₂ Offset (tons)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>

      {/* Wallet Connection Modal */}
      <ConnectWalletModal open={showWalletModal} onOpenChange={setShowWalletModal} />
    </section>
  );
};

export default Hero;

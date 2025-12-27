import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Menu, X } from "lucide-react";
import { useState } from "react";
import { WalletButton } from "@/components/wallets/WalletButton";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-eco flex items-center justify-center group-hover:scale-110 transition-transform">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient-eco">Trash2Pay</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              How It Works
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Features
            </a>
            <a href="#rewards" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Rewards
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <WalletButton />
            <Button variant="ghost" asChild>
              <Link to="/collector">Collector</Link>
            </Button>
            <Button asChild className="gradient-eco border-0 hover:opacity-90 transition-opacity">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <nav className="flex flex-col gap-4">
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                How It Works
              </a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Features
              </a>
              <a href="#rewards" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Rewards
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <WalletButton />
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/collector">Collector</Link>
                </Button>
                <Button asChild className="gradient-eco border-0">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  Coins,
  Factory,
  Package,
  TrendingUp,
  ArrowLeft,
  CheckCircle2,
  Timer,
  Scale,
  Recycle,
} from "lucide-react";
import { WalletGate } from "@/components/wallets/WalletGate";
import { WalletButton } from "@/components/wallets/WalletButton";
import { useWallet } from "@/contexts/WalletContext";
import { WalletBalanceCard } from "@/components/payments/WalletBalanceCard";
import { UserQRCode } from "@/components/qr/UserQRCode";

// Mock data for incoming waste batches
const mockBatches = [
  {
    id: "1",
    collectorName: "John Collector",
    wasteType: "Recyclables",
    weight: 45,
    status: "pending",
    receivedAt: "2024-01-15",
  },
  {
    id: "2",
    collectorName: "Jane Collector",
    wasteType: "E-Waste",
    weight: 12,
    status: "processing",
    receivedAt: "2024-01-14",
  },
  {
    id: "3",
    collectorName: "Mike Collector",
    wasteType: "Organic",
    weight: 78,
    status: "completed",
    receivedAt: "2024-01-12",
    tokensEarned: 156,
  },
];

const ProcessorContent = () => {
  const { walletProfile } = useWallet();
  const [processorTokens, setProcessorTokens] = useState(1250);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Processed
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-eco-gold/10 text-eco-gold border-eco-gold/20 hover:bg-eco-gold/10">
            <Recycle className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-eco-sky/10 text-eco-sky border-eco-sky/20 hover:bg-eco-sky/10">
            <Timer className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-eco flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-gradient-eco">Trash2Pay</span>
                <Badge variant="outline" className="ml-2 border-eco-sky/30 text-eco-sky">
                  Processor
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-eco-gold/10 border border-eco-gold/20">
                <Coins className="w-4 h-4 text-eco-gold" />
                <span className="font-semibold text-eco-gold">{processorTokens} T2P</span>
              </div>
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Processing Center Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage incoming waste batches and track processing metrics.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-eco-gold/10 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-eco-gold" />
                </div>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-1">{processorTokens}</div>
              <div className="text-sm text-muted-foreground">T2P Units</div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-eco-sky/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-eco-sky" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">23</div>
              <div className="text-sm text-muted-foreground">Batches Received</div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Scale className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">1,250 kg</div>
              <div className="text-sm text-muted-foreground">Total Processed</div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-eco-leaf/10 flex items-center justify-center">
                  <Recycle className="w-6 h-6 text-eco-leaf" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">92%</div>
              <div className="text-sm text-muted-foreground">Recycling Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Incoming Batches */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Incoming Waste Batches</CardTitle>
                <CardDescription>Waste delivered by collectors for processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-eco-sky/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-eco-sky/10 flex items-center justify-center">
                          <Package className="w-6 h-6 text-eco-sky" />
                        </div>
                        <div>
                          <div className="font-semibold">{batch.wasteType}</div>
                          <div className="text-sm text-muted-foreground">
                            From: {batch.collectorName} • {batch.weight}kg
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {batch.status === "completed" && batch.tokensEarned && (
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-eco-gold font-semibold">
                              <Coins className="w-4 h-4" />
                              +{batch.tokensEarned}
                            </div>
                          </div>
                        )}
                        {getStatusBadge(batch.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Token Balance */}
            <WalletBalanceCard />

            {/* Processing Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Metrics</CardTitle>
                <CardDescription>This month's performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recyclables</span>
                  <span className="font-semibold text-primary">580 kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">E-Waste</span>
                  <span className="font-semibold text-eco-gold">120 kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Organic</span>
                  <span className="font-semibold text-eco-leaf">350 kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">General</span>
                  <span className="font-semibold text-muted-foreground">200 kg</span>
                </div>
              </CardContent>
            </Card>

            {/* Processor QR Code */}
            <UserQRCode />
          </div>
        </div>
      </main>
    </div>
  );
};

const Processor = () => {
  return (
    <WalletGate requiredRole="processor">
      <ProcessorContent />
    </WalletGate>
  );
};

export default Processor;

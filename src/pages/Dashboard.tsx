import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  Coins,
  Recycle,
  MapPin,
  Calendar,
  Clock,
  Plus,
  History,
  TrendingUp,
  ArrowLeft,
  CheckCircle2,
  Truck,
  Timer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { WalletGate } from "@/components/wallets/WalletGate";
import { WalletButton } from "@/components/wallets/WalletButton";
import { useWallet } from "@/contexts/WalletContext";

// Mock data
const mockPickups = [
  {
    id: "1",
    date: "2024-01-15",
    time: "10:30 AM",
    status: "completed",
    wasteType: "Recyclables",
    tokens: 15,
  },
  {
    id: "2",
    date: "2024-01-12",
    time: "2:00 PM",
    status: "completed",
    wasteType: "General Waste",
    tokens: 10,
  },
  {
    id: "3",
    date: "2024-01-10",
    time: "9:00 AM",
    status: "completed",
    wasteType: "Organic",
    tokens: 12,
  },
  {
    id: "4",
    date: "2024-01-18",
    time: "11:00 AM",
    status: "pending",
    wasteType: "Recyclables",
    tokens: 0,
  },
];

const DashboardContent = () => {
  const { walletProfile } = useWallet();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [wasteType, setWasteType] = useState("");
  const [notes, setNotes] = useState("");

  const handleRequestPickup = () => {
    if (!address || !wasteType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Pickup Requested!",
      description: "A collector will be assigned to your pickup soon.",
    });
    setIsDialogOpen(false);
    setAddress("");
    setWasteType("");
    setNotes("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-eco-sky/10 text-eco-sky border-eco-sky/20 hover:bg-eco-sky/10">
            <Truck className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-eco-gold/10 text-eco-gold border-eco-gold/20 hover:bg-eco-gold/10">
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
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-eco-gold/10 border border-eco-gold/20">
                <Coins className="w-4 h-4 text-eco-gold" />
                <span className="font-semibold text-eco-gold">245 T2P</span>
              </div>
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-muted-foreground">Manage your pickups and track your eco-rewards.</p>
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
              <div className="text-3xl font-bold mb-1">245</div>
              <div className="text-sm text-muted-foreground">T2P Tokens</div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Recycle className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">12</div>
              <div className="text-sm text-muted-foreground">Total Pickups</div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-eco-leaf/10 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-eco-leaf" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">48kg</div>
              <div className="text-sm text-muted-foreground">Waste Recycled</div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-eco-sky/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-eco-sky" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">5</div>
              <div className="text-sm text-muted-foreground">Day Streak 🔥</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Request Pickup Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pickup History</CardTitle>
                  <CardDescription>Your recent waste collection requests</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-eco border-0 hover:opacity-90">
                      <Plus className="w-4 h-4 mr-2" />
                      Request Pickup
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Request Waste Pickup</DialogTitle>
                      <DialogDescription>
                        Schedule a pickup and start earning rewards
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Pickup Address *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="address"
                            placeholder="Enter your address"
                            className="pl-10"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wasteType">Waste Type *</Label>
                        <Select value={wasteType} onValueChange={setWasteType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select waste type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recyclables">Recyclables (+5 bonus)</SelectItem>
                            <SelectItem value="organic">Organic Waste</SelectItem>
                            <SelectItem value="general">General Waste</SelectItem>
                            <SelectItem value="electronic">E-Waste (+10 bonus)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special instructions for the collector..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button className="gradient-eco border-0" onClick={handleRequestPickup}>
                        Schedule Pickup
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPickups.map((pickup) => (
                    <div
                      key={pickup.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Recycle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{pickup.wasteType}</div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {pickup.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {pickup.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {pickup.status === "completed" && (
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-eco-gold font-semibold">
                              <Coins className="w-4 h-4" />
                              +{pickup.tokens}
                            </div>
                          </div>
                        )}
                        {getStatusBadge(pickup.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Token Balance Card */}
            <Card className="overflow-hidden">
              <div className="gradient-eco p-6 text-primary-foreground">
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="w-6 h-6" />
                  <span className="font-semibold">T2P Balance</span>
                </div>
                <div className="text-4xl font-bold mb-1">245.00</div>
                <div className="text-sm opacity-80">≈ $24.50 USD</div>
              </div>
              <CardContent className="p-4">
                <Button variant="outline" className="w-full">
                  <History className="w-4 h-4 mr-2" />
                  Transaction History
                </Button>
              </CardContent>
            </Card>

            {/* Environmental Impact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Impact</CardTitle>
                <CardDescription>Environmental contribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">CO₂ Saved</span>
                  <span className="font-semibold text-primary">12.5 kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trees Equivalent</span>
                  <span className="font-semibold text-eco-leaf">0.5 trees</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Waste Diverted</span>
                  <span className="font-semibold text-eco-sky">48 kg</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto flex-col py-4">
                  <MapPin className="w-5 h-5 mb-2" />
                  <span className="text-xs">Find Collectors</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col py-4">
                  <Recycle className="w-5 h-5 mb-2" />
                  <span className="text-xs">Recycling Tips</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => {
  return (
    <WalletGate requiredRole="user">
      <DashboardContent />
    </WalletGate>
  );
};

export default Dashboard;

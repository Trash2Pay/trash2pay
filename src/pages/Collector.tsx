import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  Coins,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Navigation,
  Phone,
  User,
  Package,
  TrendingUp,
  QrCode,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { WalletGate } from "@/components/wallets/WalletGate";
import { WalletButton } from "@/components/wallets/WalletButton";
import { QRScanner } from "@/components/collector/QRScanner";

// Mock data for pickup requests
const mockRequests = [
  {
    id: "1",
    userName: "John Doe",
    address: "123 Green Street, Eco City",
    wasteType: "Recyclables",
    scheduledTime: "10:30 AM",
    scheduledDate: "2024-01-18",
    status: "pending",
    phone: "+1 234 567 8900",
    notes: "Please collect from the back gate",
  },
  {
    id: "2",
    userName: "Jane Smith",
    address: "456 Sustainable Ave, Green Town",
    wasteType: "E-Waste",
    scheduledTime: "2:00 PM",
    scheduledDate: "2024-01-18",
    status: "pending",
    phone: "+1 234 567 8901",
    notes: "Old laptop and phone",
  },
  {
    id: "3",
    userName: "Mike Johnson",
    address: "789 Recycle Road, Cleanville",
    wasteType: "Organic",
    scheduledTime: "4:30 PM",
    scheduledDate: "2024-01-18",
    status: "assigned",
    phone: "+1 234 567 8902",
    notes: "",
  },
];

const completedPickups = [
  {
    id: "4",
    userName: "Sarah Wilson",
    wasteType: "Recyclables",
    date: "2024-01-17",
    tokensEarned: 8,
  },
  {
    id: "5",
    userName: "Tom Brown",
    wasteType: "General Waste",
    date: "2024-01-17",
    tokensEarned: 5,
  },
  {
    id: "6",
    userName: "Emily Davis",
    wasteType: "E-Waste",
    date: "2024-01-16",
    tokensEarned: 12,
  },
];

const CollectorContent = () => {
  const [selectedRequest, setSelectedRequest] = useState<typeof mockRequests[0] | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [collectorTokens, setCollectorTokens] = useState(890);

  const handleAcceptPickup = (request: typeof mockRequests[0]) => {
    toast({
      title: "Pickup Accepted!",
      description: `You've been assigned to collect from ${request.userName}`,
    });
    setIsDetailsOpen(false);
  };

  const handleCompletePickup = () => {
    setIsDetailsOpen(false);
    setIsQRScannerOpen(true);
  };

  const handlePickupVerified = (pickupData: any, reward: number) => {
    const collectorReward = Math.round(reward * 0.3);
    setCollectorTokens((prev) => prev + collectorReward);
    toast({
      title: "Pickup Verified! 🎉",
      description: `You earned ${collectorReward} T2P tokens!`,
    });
  };

  const getWasteTypeColor = (type: string) => {
    switch (type) {
      case "Recyclables":
        return "bg-primary/10 text-primary border-primary/20";
      case "E-Waste":
        return "bg-eco-gold/10 text-eco-gold border-eco-gold/20";
      case "Organic":
        return "bg-eco-leaf/10 text-eco-leaf border-eco-leaf/20";
      default:
        return "bg-muted text-muted-foreground border-border";
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
                <span className="font-bold text-gradient-eco">Collector Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
                Online
              </Badge>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-eco-gold/10 border border-eco-gold/20">
                <Coins className="w-4 h-4 text-eco-gold" />
                <span className="font-semibold text-eco-gold">{collectorTokens} T2P</span>
              </div>
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="gradient-card border-border/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-eco-gold/10 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-eco-gold" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold">890</div>
              <div className="text-xs md:text-sm text-muted-foreground">T2P Earned</div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold">3</div>
              <div className="text-xs md:text-sm text-muted-foreground">Pending Pickups</div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-eco-leaf/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-eco-leaf" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold">47</div>
              <div className="text-xs md:text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-eco-sky/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-eco-sky" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold">4.9</div>
              <div className="text-xs md:text-sm text-muted-foreground">Rating ⭐</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pickup Requests */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Available Pickup Requests</CardTitle>
                <CardDescription>Accept requests to start collecting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold">{request.userName}</div>
                              <Badge className={`text-xs ${getWasteTypeColor(request.wasteType)}`}>
                                {request.wasteType}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{request.address}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {request.scheduledDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {request.scheduledTime}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="gradient-eco border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptPickup(request);
                          }}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full gradient-eco border-0 justify-start"
                  onClick={() => setIsQRScannerOpen(true)}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR Code
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Navigation className="w-4 h-4 mr-2" />
                  View Route Map
                </Button>
              </CardContent>
            </Card>

            {/* Recent Completions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Completions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedPickups.map((pickup) => (
                    <div
                      key={pickup.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <div className="font-medium text-sm">{pickup.userName}</div>
                        <div className="text-xs text-muted-foreground">{pickup.wasteType}</div>
                      </div>
                      <div className="flex items-center gap-1 text-eco-gold font-semibold text-sm">
                        <Coins className="w-3 h-3" />
                        +{pickup.tokensEarned}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Request Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pickup Details</DialogTitle>
            <DialogDescription>Review request information</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-lg">{selectedRequest.userName}</div>
                  <Badge className={getWasteTypeColor(selectedRequest.wasteType)}>
                    {selectedRequest.wasteType}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Address</div>
                    <div className="text-sm text-muted-foreground">{selectedRequest.address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Scheduled Time</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedRequest.scheduledDate} at {selectedRequest.scheduledTime}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Contact</div>
                    <div className="text-sm text-muted-foreground">{selectedRequest.phone}</div>
                  </div>
                </div>
                {selectedRequest.notes && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-sm font-medium mb-1">Notes</div>
                    <div className="text-sm text-muted-foreground">{selectedRequest.notes}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsDetailsOpen(false)}>
                  Cancel
                </Button>
                {selectedRequest.status === "pending" ? (
                  <Button
                    className="flex-1 gradient-eco border-0"
                    onClick={() => handleAcceptPickup(selectedRequest)}
                  >
                    Accept Pickup
                  </Button>
                ) : (
                  <Button
                    className="flex-1 gradient-eco border-0"
                    onClick={handleCompletePickup}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Scanner */}
      <QRScanner
        open={isQRScannerOpen}
        onOpenChange={setIsQRScannerOpen}
        onPickupVerified={handlePickupVerified}
      />
    </div>
  );
};

const Collector = () => {
  return (
    <WalletGate requiredRole="collector">
      <CollectorContent />
    </WalletGate>
  );
};

export default Collector;

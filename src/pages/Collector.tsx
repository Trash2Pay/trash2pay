import { useState } from "react";
import { useCollectorPickups, type PickupRow } from "@/hooks/usePickups";
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
import { UserQRCode } from "@/components/qr/UserQRCode";
import { WalletBalanceCard } from "@/components/payments/WalletBalanceCard";

// Pickup data is fetched from the database via useCollectorPickups()

const CollectorContent = () => {
  const { available, assigned, completed, loading, acceptPickup, completePickup, formatWasteLabel } = useCollectorPickups();
  const [selectedRequest, setSelectedRequest] = useState<PickupRow | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [collectorTokens, setCollectorTokens] = useState(890);
  const allRequests = [...available, ...assigned];
  const handleAcceptPickup = async (request: PickupRow) => {
    try {
      await acceptPickup(request.id);
      toast({
        title: "Pickup Accepted!",
        description: `You've been assigned to collect from ${request.user_name || "user"}`,
      });
      setIsDetailsOpen(false);
    } catch (err: any) {
      toast({
        title: "Failed to accept",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompletePickup = () => {
    setIsDetailsOpen(false);
    setIsQRScannerOpen(true);
  };

  const handlePickupVerified = async (pickupData: any, reward: number) => {
    const collectorReward = Math.round(reward * 0.3);
    setCollectorTokens((prev) => prev + collectorReward);
    if (selectedRequest) {
      try { await completePickup(selectedRequest.id, reward); } catch (e) { console.error(e); }
    }
    toast({
      title: "Pickup Verified! 🎉",
      description: `You earned ${collectorReward} T2P Units!`,
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
              <div className="text-2xl md:text-3xl font-bold">{available.length}</div>
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
              <div className="text-2xl md:text-3xl font-bold">{completed.length}</div>
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
                  {loading && (
                    <div className="text-sm text-muted-foreground text-center py-8">Loading requests...</div>
                  )}
                  {!loading && allRequests.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No pickup requests available right now.
                    </div>
                  )}
                  {allRequests.map((request) => {
                    const wasteLabel = formatWasteLabel(request.waste_type);
                    const created = new Date(request.created_at);
                    const dateStr = request.scheduled_date || created.toISOString().split("T")[0];
                    const timeStr = created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    return (
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
                                <div className="font-semibold">{request.user_name}</div>
                                <Badge className={`text-xs ${getWasteTypeColor(wasteLabel)}`}>
                                  {wasteLabel}
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
                                {dateStr}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeStr}
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                          {request.status === "pending" && (
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
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                  {completed.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">No completed pickups yet.</div>
                  )}
                  {completed.map((pickup) => (
                    <div
                      key={pickup.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <div className="font-medium text-sm">{pickup.user_name}</div>
                        <div className="text-xs text-muted-foreground">{formatWasteLabel(pickup.waste_type)}</div>
                      </div>
                      <div className="flex items-center gap-1 text-eco-gold font-semibold text-sm">
                        <Coins className="w-3 h-3" />
                        +{Number(pickup.reward_tokens) || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Collector QR Code */}
            <UserQRCode />
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
                  <div className="font-semibold text-lg">{selectedRequest.user_name}</div>
                  <Badge className={getWasteTypeColor(formatWasteLabel(selectedRequest.waste_type))}>
                    {formatWasteLabel(selectedRequest.waste_type)}
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
                    <div className="text-sm font-medium">Scheduled</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedRequest.scheduled_date || new Date(selectedRequest.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {selectedRequest.user_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Contact</div>
                      <div className="text-sm text-muted-foreground">{selectedRequest.user_phone}</div>
                    </div>
                  </div>
                )}
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

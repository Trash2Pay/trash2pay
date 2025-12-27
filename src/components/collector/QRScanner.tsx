import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  Coins, 
  User, 
  Package,
  X,
  Loader2
} from "lucide-react";

interface PickupData {
  pickupId: string;
  userId: string;
  userName: string;
  wasteType: string;
  weight?: number;
  userWallet?: string;
}

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickupVerified?: (pickupData: PickupData, reward: number) => void;
}

export const QRScanner = ({ open, onOpenChange, onPickupVerified }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<PickupData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { walletProfile } = useWallet();

  const calculateReward = (wasteType: string, weight?: number): number => {
    const baseReward: Record<string, number> = {
      'Recyclables': 10,
      'E-Waste': 15,
      'Organic': 5,
      'General Waste': 3,
    };
    const base = baseReward[wasteType] || 5;
    const weightMultiplier = weight ? Math.min(weight * 0.5, 10) : 1;
    return Math.round(base + weightMultiplier);
  };

  const startScanning = async () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader");
    }

    try {
      setIsScanning(true);
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {} // Ignore failures
      );
    } catch (err) {
      console.error("Failed to start scanner:", err);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    await stopScanning();

    try {
      // Parse QR code data - expected format: JSON with pickup info
      const data = JSON.parse(decodedText) as PickupData;
      const reward = calculateReward(data.wasteType, data.weight);
      setScannedData(data);
      setRewardAmount(reward);
    } catch {
      // If not valid JSON, create mock data for demo
      const mockData: PickupData = {
        pickupId: `pickup-${Date.now()}`,
        userId: "user-123",
        userName: "Demo User",
        wasteType: "Recyclables",
        weight: 2.5,
      };
      const reward = calculateReward(mockData.wasteType, mockData.weight);
      setScannedData(mockData);
      setRewardAmount(reward);
    }
  };

  const handleConfirmPickup = async () => {
    if (!scannedData) return;

    setIsProcessing(true);

    // Simulate reward distribution
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Pickup Verified! 🎉",
      description: `${rewardAmount} T2C tokens distributed. User: ${rewardAmount * 0.7} T2C, Collector: ${rewardAmount * 0.3} T2C`,
    });

    onPickupVerified?.(scannedData, rewardAmount);
    
    setIsProcessing(false);
    setScannedData(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    stopScanning();
    setScannedData(null);
    onOpenChange(false);
  };

  useEffect(() => {
    if (open && !scannedData) {
      const timer = setTimeout(startScanning, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            {scannedData ? "Verify Pickup" : "Scan QR Code"}
          </DialogTitle>
          <DialogDescription>
            {scannedData 
              ? "Review pickup details and confirm to distribute rewards"
              : "Point camera at the user's pickup QR code"
            }
          </DialogDescription>
        </DialogHeader>

        {!scannedData ? (
          <div className="space-y-4">
            {/* Scanner View */}
            <div className="relative rounded-xl overflow-hidden bg-muted aspect-square">
              <div id="qr-reader" className="w-full h-full" />
              
              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                  <Button onClick={startScanning} className="gradient-eco border-0">
                    Start Camera
                  </Button>
                </div>
              )}
            </div>

            {/* Scanning indicator */}
            {isScanning && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Scanning for QR codes...
              </div>
            )}

            {/* Demo button for testing */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleScanSuccess(JSON.stringify({
                pickupId: "demo-pickup-001",
                userId: "demo-user",
                userName: "Sarah Wilson",
                wasteType: "Recyclables",
                weight: 3.2,
              }))}
            >
              Demo: Simulate Scan
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Scanned Pickup Details */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{scannedData.userName}</div>
                    <div className="text-sm text-muted-foreground">
                      Pickup ID: {scannedData.pickupId.slice(0, 12)}...
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-background">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Package className="w-4 h-4" />
                      Waste Type
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {scannedData.wasteType}
                    </Badge>
                  </div>
                  {scannedData.weight && (
                    <div className="p-3 rounded-lg bg-background">
                      <div className="text-sm text-muted-foreground mb-1">Weight</div>
                      <div className="font-semibold">{scannedData.weight} kg</div>
                    </div>
                  )}
                </div>

                {/* Reward Preview */}
                <div className="p-4 rounded-xl bg-eco-gold/10 border border-eco-gold/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Reward Distribution</span>
                    <Badge className="bg-eco-gold/20 text-eco-gold border-eco-gold/30">
                      <Coins className="w-3 h-3 mr-1" />
                      {rewardAmount} T2C Total
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User Reward (70%)</span>
                      <span className="font-medium text-eco-gold">{Math.round(rewardAmount * 0.7)} T2C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Collector Reward (30%)</span>
                      <span className="font-medium text-eco-gold">{Math.round(rewardAmount * 0.3)} T2C</span>
                    </div>
                  </div>
                </div>

                {/* Connected Wallet Info */}
                {walletProfile && (
                  <div className="text-xs text-muted-foreground text-center">
                    Sending to: {walletProfile.walletType === 'handcash' ? `@${walletProfile.handle}` : `${walletProfile.handle.slice(0, 8)}...`}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setScannedData(null)}
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-2" />
                Rescan
              </Button>
              <Button 
                className="flex-1 gradient-eco border-0"
                onClick={handleConfirmPickup}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                {isProcessing ? "Processing..." : "Confirm & Pay"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

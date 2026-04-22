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
import { supabase } from "@/integrations/supabase/client";
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  Coins, 
  User, 
  Package,
  X,
  Loader2,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";

interface VerifiedQRData {
  qrOwner: string;
  verified: boolean;
  scanCount: number;
}

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
  const [verifiedData, setVerifiedData] = useState<VerifiedQRData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
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
      setVerificationError(null);
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
    setIsVerifying(true);
    setVerificationError(null);

    try {
      // Verify the QR code with the backend
      // =========================
    // ✅ GET USER ID (AUTH)
    // =========================
    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData?.user?.id || null;

    // =========================
    // ✅ GET WALLET ID
    // =========================
    const walletId = walletProfile?.handle || null;

    // =========================
    // ✅ ENSURE WE HAVE AT LEAST ONE IDENTITY
    // =========================
    if (!authUserId && !walletId) {
      throw new Error("No identity found (login or connect wallet)");
    }

    console.log("🧾 Scanner Identity:", {
      authUserId,
      walletId,
    });
// =========================
    // ✅ CALL EDGE FUNCTION
    // =========================
    const { data, error } = await supabase.functions.invoke(
      "verify-qr-code",
      {
        body: {
          qrData: decodedText,
          scannedByUserId: authUserId, // may be null
          scannedByWallet: walletId,   // may be null
        },
      }
    );

    if (error) throw error;

    if (!data?.verified) {
      setVerificationError(data?.error || "QR code verification failed");
      setVerifiedData(null);
      setScannedData(null);

      toast({
        title: "Invalid QR Code",
        description: data?.error || "This QR code cannot be verified",
        variant: "destructive",
      });

      return;
    }

      // QR verified! Create pickup data
      setVerifiedData({
      qrOwner: data.user,
      verified: true,
      scanCount: data.scanCount,
    });

    const pickupData: PickupData = {
      pickupId: `pickup-${Date.now()}`,
      userId: data.user,
      userName: data.user,
      wasteType: "Recyclables",
      weight: 2.5,
      userWallet: data.user,
    };

    const reward = calculateReward(
      pickupData.wasteType,
      pickupData.weight
    );

    setScannedData(pickupData);
    setRewardAmount(reward);

    toast({
      title: "QR Code Verified! ✅",
      description: `User: ${data.user} - Scan #${data.scanCount}`,
    });

  } catch (err: any) {
    console.error("QR verification error:", err);

    setVerificationError(err.message || "Failed to verify QR code");

    toast({
      title: "Verification Error",
      description: err.message || "Failed to verify QR code",
      variant: "destructive",
    });

  } finally {
    setIsVerifying(false);
  }
};

  const handleConfirmPickup = async () => {
    if (!scannedData) return;

    setIsProcessing(true);

    // Simulate reward distribution
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Pickup Verified! 🎉",
      description: `${rewardAmount} T2P Units distributed. User: ${Math.round(rewardAmount * 0.7)} T2P, Collector: ${Math.round(rewardAmount * 0.3)} T2P`,
    });

    onPickupVerified?.(scannedData, rewardAmount);
    
    setIsProcessing(false);
    setScannedData(null);
    setVerifiedData(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    stopScanning();
    setScannedData(null);
    setVerifiedData(null);
    setVerificationError(null);
    onOpenChange(false);
  };

  const handleRescan = () => {
    setScannedData(null);
    setVerifiedData(null);
    setVerificationError(null);
    startScanning();
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
              : "Scan the user's Trash2Pay QR code from their waste bin"
            }
          </DialogDescription>
        </DialogHeader>

        {!scannedData ? (
          <div className="space-y-4">
            {/* Scanner View */}
            <div className="relative rounded-xl overflow-hidden bg-muted aspect-square">
              <div id="qr-reader" className="w-full h-full" />
              
              {isVerifying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/90 z-10">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <span className="text-sm font-medium">Verifying QR Code...</span>
                </div>
              )}
              
              {!isScanning && !isVerifying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                  <Button onClick={startScanning} className="gradient-eco border-0">
                    Start Camera
                  </Button>
                </div>
              )}
            </div>

            {/* Verification Error */}
            {verificationError && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <ShieldAlert className="w-5 h-5" />
                  <span className="font-medium">Invalid QR Code</span>
                </div>
                <p className="text-sm text-destructive/80">{verificationError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={handleRescan}
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Scanning indicator */}
            {isScanning && !isVerifying && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Scanning for QR codes...
              </div>
            )}

            {/* Security notice */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Only QR codes generated by Trash2Pay will be accepted</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Verified Badge */}
            {verifiedData && (
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-medium">Verified Trash2Pay QR Code</span>
              </div>
            )}

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
                      {verifiedData && `Disposal count: ${verifiedData.scanCount}`}
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
                      {rewardAmount} T2P Total
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User Reward (70%)</span>
                      <span className="font-medium text-eco-gold">{Math.round(rewardAmount * 0.7)} T2P</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Collector Reward (30%)</span>
                      <span className="font-medium text-eco-gold">{Math.round(rewardAmount * 0.3)} T2P</span>
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
                onClick={handleRescan}
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

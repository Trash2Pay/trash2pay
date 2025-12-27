import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Recycle, Truck, ArrowRight, Coins, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REGISTRATION_FEE = 10; // Satoshis

const RoleSelection = () => {
  const { isConnected, walletProfile, setUserRole, userRole } = useWallet();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'collector' | null>(null);
  const [transactionResult, setTransactionResult] = useState<{
    transactionId: string;
    whatsonchainUrl: string;
  } | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Redirect if already has a role
  useEffect(() => {
    if (userRole === 'user') {
      navigate('/dashboard');
    } else if (userRole === 'collector') {
      navigate('/collector');
    }
  }, [userRole, navigate]);

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  const handleSelectRole = async (role: 'user' | 'collector') => {
    if (!walletProfile) {
      toast.error('Wallet not connected');
      return;
    }

    const authToken = localStorage.getItem('handcash_auth_token');
    if (!authToken && walletProfile.walletType === 'handcash') {
      toast.error('Please reconnect your HandCash wallet');
      return;
    }

    setSelectedRole(role);
    setIsProcessing(true);

    try {
      toast.info(`Processing registration fee of ${REGISTRATION_FEE} Satoshis...`);

      const { data, error } = await supabase.functions.invoke('register-user', {
        body: {
          authToken,
          role,
          walletHandle: walletProfile.handle,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Registration failed');

      // Store transaction result
      setTransactionResult({
        transactionId: data.transactionId,
        whatsonchainUrl: data.whatsonchainUrl,
      });

      // Show success dialog
      setShowSuccessDialog(true);

      // Set role in context
      setUserRole(role);

      toast.success('Registration successful! Transaction recorded on blockchain.');
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Registration failed. Please try again.');
      setSelectedRole(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    setShowSuccessDialog(false);
    if (selectedRole === 'user') {
      navigate('/dashboard');
    } else {
      navigate('/collector');
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center overflow-hidden relative">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-xl gradient-eco flex items-center justify-center">
                <Leaf className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Welcome, <span className="text-gradient-eco">{walletProfile?.displayName || walletProfile?.handle || 'Eco Warrior'}</span>!
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Choose how you want to participate in the Trash2Cash ecosystem
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
              <Coins className="w-4 h-4" />
              <span>Registration fee: {REGISTRATION_FEE} Satoshis</span>
            </div>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* User Role */}
            <Card 
              className={`gradient-card border-border/50 cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02] group ${
                isProcessing ? 'pointer-events-none opacity-50' : ''
              }`}
              onClick={() => !isProcessing && handleSelectRole('user')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Recycle className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Start Earning</CardTitle>
                <CardDescription className="text-base">
                  Request pickups and earn T2C tokens for your recyclables
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Schedule waste pickups from your location</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Earn T2C tokens for every successful pickup</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Track your environmental impact</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Withdraw rewards to your BSV wallet</span>
                  </div>
                </div>
                <Button 
                  className="w-full gradient-eco border-0 mt-4 group-hover:opacity-90"
                  disabled={isProcessing}
                >
                  {isProcessing && selectedRole === 'user' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      Continue as User
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Collector Role */}
            <Card 
              className={`gradient-card border-border/50 cursor-pointer hover:border-eco-gold/50 transition-all hover:scale-[1.02] group ${
                isProcessing ? 'pointer-events-none opacity-50' : ''
              }`}
              onClick={() => !isProcessing && handleSelectRole('collector')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 rounded-2xl bg-eco-gold/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-eco-gold/20 transition-colors">
                  <Truck className="w-10 h-10 text-eco-gold" />
                </div>
                <CardTitle className="text-2xl">Join as Collector</CardTitle>
                <CardDescription className="text-base">
                  Collect waste and earn T2C tokens for your service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-eco-gold flex-shrink-0" />
                    <span>Accept pickup requests in your area</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-eco-gold flex-shrink-0" />
                    <span>Earn 30% commission on every pickup</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-eco-gold flex-shrink-0" />
                    <span>Use QR scanner to verify pickups</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-eco-gold flex-shrink-0" />
                    <span>Build your reputation and grow your network</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-eco-gold/30 hover:bg-eco-gold/10 hover:text-eco-gold"
                  disabled={isProcessing}
                >
                  {isProcessing && selectedRole === 'collector' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      Continue as Collector
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-muted-foreground">
            A one-time registration fee of {REGISTRATION_FEE} Satoshis will be charged to your wallet
          </p>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              Registration Successful!
            </DialogTitle>
            <DialogDescription>
              Your registration has been recorded on the BSV blockchain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Transaction ID:</p>
              <p className="text-xs font-mono break-all">{transactionResult?.transactionId}</p>
            </div>
            <a
              href={transactionResult?.whatsonchainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              View on Whatsonchain
            </a>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleContinue} className="gradient-eco border-0">
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleSelection;
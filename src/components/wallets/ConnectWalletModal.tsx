import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Loader2, ExternalLink, ArrowLeft } from 'lucide-react';
import { useWallet, WalletType } from '@/contexts/WalletContext';

interface ConnectWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { connectHandCash, connectElectrumSV, isConnecting, error } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [electrumAddress, setElectrumAddress] = useState('');

  const handleConnectHandCash = async () => {
    await connectHandCash();
  };

  const handleConnectElectrum = async () => {
    await connectElectrumSV(electrumAddress);
    if (!error) {
      onOpenChange(false);
      setSelectedWallet(null);
      setElectrumAddress('');
    }
  };

  const handleBack = () => {
    setSelectedWallet(null);
    setElectrumAddress('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedWallet(null);
      setElectrumAddress('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedWallet && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 mr-1"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Wallet className="w-5 h-5 text-primary" />
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription>
            {selectedWallet 
              ? `Connect with ${selectedWallet === 'handcash' ? 'HandCash' : 'ElectrumSV'}`
              : 'Select a BSV wallet to start earning T2P tokens for waste disposal, collection or recycling'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {!selectedWallet ? (
            // Wallet selection view
            <div className="space-y-3">
              <button
                onClick={() => setSelectedWallet('handcash')}
                className="w-full p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#38CB7C] flex items-center justify-center">
                    <span className="text-xl font-bold text-white">H</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">HandCash</h3>
                    <p className="text-sm text-muted-foreground">
                      OAuth login with HandCash account
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedWallet('electrumsv')}
                className="w-full p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1E90FF] flex items-center justify-center">
                    <span className="text-xl font-bold text-white">E</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">ElectrumSV</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect with your BSV address
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : selectedWallet === 'handcash' ? (
            // HandCash connection view
            <div className="p-6 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#38CB7C] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">H</span>
                </div>
                <div>
                  <h3 className="font-semibold">HandCash</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with your HandCash wallet
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleConnectHandCash}
                disabled={isConnecting}
                className="w-full gradient-eco border-0 hover:opacity-90"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect HandCash
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Don't have a HandCash wallet?{' '}
                <a
                  href="https://handcash.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Create one for free
                </a>
              </p>
            </div>
          ) : (
            // ElectrumSV connection view
            <div className="p-6 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#1E90FF] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">E</span>
                </div>
                <div>
                  <h3 className="font-semibold">ElectrumSV</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your BSV receiving address
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Input
                  placeholder="Enter your BSV address (e.g., 1A1zP1...)"
                  value={electrumAddress}
                  onChange={(e) => setElectrumAddress(e.target.value)}
                  className="w-full"
                />
                
                <Button
                  onClick={handleConnectElectrum}
                  disabled={isConnecting || !electrumAddress.trim()}
                  className="w-full gradient-eco border-0 hover:opacity-90"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Wallet'
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Don't have ElectrumSV?{' '}
                <a
                  href="https://electrumsv.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Download for free
                </a>
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

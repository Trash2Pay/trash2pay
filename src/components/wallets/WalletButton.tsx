import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown, LogOut, Copy, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWallet } from '@/contexts/WalletContext';
import { ConnectWalletModal } from './ConnectWalletModal';
import { toast } from '@/hooks/use-toast';

export const WalletButton: React.FC = () => {
  const { isConnected, isConnecting, walletProfile, disconnect } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyHandle = () => {
    if (walletProfile?.handle) {
      navigator.clipboard.writeText(`$${walletProfile.handle}`);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Wallet handle copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  if (!isConnected) {
    return (
      <>
        <Button
          onClick={() => setShowModal(true)}
          disabled={isConnecting}
          variant="outline"
          className="border-primary/30 hover:bg-primary/10"
        >
          <Wallet className="w-4 h-4 mr-2" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
        <ConnectWalletModal open={showModal} onOpenChange={setShowModal} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
          {walletProfile?.avatarUrl ? (
            <img
              src={walletProfile.avatarUrl}
              alt={walletProfile.handle}
              className="w-5 h-5 rounded-full mr-2"
            />
          ) : (
            <Wallet className="w-4 h-4 mr-2 text-primary" />
          )}
          <span className="font-medium">${walletProfile?.handle}</span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium">
            {walletProfile?.displayName || walletProfile?.handle}
          </p>
          <p className="text-xs text-muted-foreground">
            {walletProfile?.paymail}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyHandle}>
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-primary" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          Copy Handle
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
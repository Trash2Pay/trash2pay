import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Printer, RefreshCw, Download, Shield, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';

interface UserQRCodeProps {
  className?: string;
}

export const UserQRCode: React.FC<UserQRCodeProps> = ({ className }) => {
  const { walletProfile, userRole } = useWallet();
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (walletProfile?.handle && userId) {
      fetchOrGenerateQR();
    }
  }, [walletProfile?.handle, userRole]);

  const fetchOrGenerateQR = async () => {
    if (!walletProfile?.handle) return;
    const userId = localStorage.getItem('user_id');
    if (!userId) {
    toast({
      title: "Not registered",
      description: "Please complete registration first",
      variant: "destructive",
    });
    return;
  }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-qr-code', {
        
        body: {
  userId,
  walletHandle: walletProfile.handle,
  userRole: userRole,
},
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setQrToken(data.qrToken);

      // Generate QR code image from the data
      const qrImageUrl = await QRCode.toDataURL(data.qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#166534', // Green color matching the app theme
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H', // High error correction for better scanning
      });

      setQrDataUrl(qrImageUrl);

      if (!data.isExisting) {
        toast({
          title: 'QR Code Generated!',
          description: 'Your unique waste disposal QR code is ready.',
        });
      }
    } catch (err: any) {
      console.error('Failed to generate QR code:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate QR code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Popup Blocked',
        description: 'Please allow popups to print your QR code',
        variant: 'destructive',
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trash2Pay - Waste Disposal QR Code</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .container {
              text-align: center;
              border: 3px solid #166534;
              border-radius: 16px;
              padding: 24px;
              max-width: 350px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #166534;
              margin-bottom: 8px;
            }
            .subtitle {
              color: #666;
              font-size: 14px;
              margin-bottom: 16px;
            }
            .qr-code {
              margin: 16px 0;
            }
            .qr-code img {
              width: 250px;
              height: 250px;
            }
            .user-info {
              background: #f0fdf4;
              padding: 12px;
              border-radius: 8px;
              margin-top: 16px;
            }
            .user-handle {
              font-weight: 600;
              color: #166534;
              font-size: 16px;
            }
            .role-badge {
              display: inline-block;
              background: #166534;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              margin-top: 8px;
            }
            .instructions {
              font-size: 12px;
              color: #666;
              margin-top: 16px;
              padding: 12px;
              background: #fef3c7;
              border-radius: 8px;
            }
            .footer {
              margin-top: 16px;
              font-size: 11px;
              color: #999;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🌱 Trash2Pay</div>
            <div class="subtitle">Waste Disposal Verification</div>
            
            <div class="qr-code">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            
            <div class="user-info">
              <div class="user-handle">${walletProfile?.handle}</div>
              <div class="role-badge">${userRole === 'collector' ? 'Collector' : 'User'}</div>
            </div>
            
            <div class="instructions">
              📋 Paste this QR code on your waste bin.<br/>
              It will be scanned each time you dispose waste.
            </div>
            
            <div class="footer">
              This QR code is unique to your account.<br/>
              Do not share or duplicate.
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `trash2pay-qr-${walletProfile?.handle}.png`;
    link.href = qrDataUrl;
    link.click();

    toast({
      title: 'Downloaded!',
      description: 'Your QR code has been saved.',
    });
  };

  if (!walletProfile) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <QrCode className="h-6 w-6 text-primary" />
          <CardTitle>Your Waste Disposal QR</CardTitle>
        </div>
        <CardDescription>
          Print this QR code and paste it on your waste bin for verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div ref={printRef} className="flex flex-col items-center">
          {isLoading ? (
            <div className="w-[250px] h-[250px] bg-muted animate-pulse rounded-lg flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : qrDataUrl ? (
            <div className="border-4 border-primary/20 rounded-xl p-2 bg-white">
              <img
                src={qrDataUrl}
                alt="Your unique QR code"
                className="w-[250px] h-[250px]"
              />
            </div>
          ) : (
            <div className="w-[250px] h-[250px] bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">QR code unavailable</span>
            </div>
          )}

          <div className="mt-4 text-center">
            <Badge variant="secondary" className="mb-2">
              {walletProfile.handle}
            </Badge>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Secured & Verified</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            className="flex-1"
            disabled={!qrDataUrl || isLoading}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print QR Code
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            disabled={!qrDataUrl || isLoading}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={fetchOrGenerateQR}
          variant="ghost"
          size="sm"
          className="w-full"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Regenerate QR Code
        </Button>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
            📋 Instructions
          </p>
          <ul className="text-amber-700 dark:text-amber-300 space-y-1 text-xs">
            <li>• Print and paste this QR code on your waste bin</li>
            <li>• Collectors will scan it to verify waste disposal</li>
            <li>• You'll earn T2P Unit for each verified disposal</li>
            <li>• Never share your QR code with others</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

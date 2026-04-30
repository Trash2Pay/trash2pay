import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Printer, RefreshCw, Download, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface UserQRCodeProps {
  className?: string;
}

export const UserQRCode: React.FC<UserQRCodeProps> = ({ className }) => {
  const { walletProfile, userRole } = useWallet();
  const { toast } = useToast();

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

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
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-qr-code', {
        body: {
          userId,
          walletHandle: walletProfile.handle,
          userRole,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setQrToken(data.qrToken);

      const qrImageUrl = await QRCode.toDataURL(data.qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#166534',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      setQrDataUrl(qrImageUrl);

      if (!data.isExisting) {
        toast({
          title: 'QR Code Generated!',
          description: 'Your unique waste disposal QR code is ready.',
        });
      }
    } catch (err: any) {
      console.error('QR generation error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate QR code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW: Revoke QR
  const handleRevokeQR = async () => {
    if (!walletProfile?.handle) return;

    setIsRevoking(true);

    try {
      const { data, error } = await supabase.functions.invoke('revoke-qr-code', {
        body: {
          walletHandle: walletProfile.handle,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Clear UI
      setQrDataUrl(null);
      setQrToken(null);

      toast({
        title: 'QR Code Revoked',
        description: 'Your old QR code is now invalid.',
      });

      // Auto-generate new QR
      await fetchOrGenerateQR();

    } catch (err: any) {
      console.error('Revoke error:', err);
      toast({
        title: 'Revocation Failed',
        description: err.message || 'Failed to revoke QR code',
        variant: 'destructive',
      });
    } finally {
      setIsRevoking(false);
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

    printWindow.document.write(`
      <html>
        <body style="text-align:center;">
          <h2>Trash2Pay QR Code</h2>
          <img src="${qrDataUrl}" />
          <p>${walletProfile?.handle}</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
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

  if (!walletProfile) return null;

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="flex justify-center gap-2">
          <QrCode className="h-6 w-6 text-primary" />
          <CardTitle>Your Waste QR</CardTitle>
        </div>
        <CardDescription>Use this QR for waste verification</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        <div ref={printRef} className="flex flex-col items-center">
          {isLoading ? (
            <RefreshCw className="animate-spin" />
          ) : qrDataUrl ? (
            <img src={qrDataUrl} className="w-[250px]" />
          ) : (
            <span>No QR available</span>
          )}

          <Badge className="mt-2">{walletProfile.handle}</Badge>
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePrint} disabled={!qrDataUrl}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>

          <Button onClick={handleDownload} variant="outline" disabled={!qrDataUrl}>
            <Download className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={fetchOrGenerateQR} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate QR
        </Button>

        {/* ✅ NEW: Revoke with confirmation */}
        {qrDataUrl && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Revoke QR Code
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke QR Code?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently disable your current QR code.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>

                <AlertDialogAction onClick={handleRevokeQR}>
                  {isRevoking ? 'Revoking...' : 'Yes, Revoke'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

      </CardContent>
    </Card>
  );
};
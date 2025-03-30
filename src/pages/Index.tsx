
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import axios from 'axios';
import io from 'socket.io-client';
import { MessageSquare, RefreshCw, Smartphone, LogOut, Wifi, WifiOff } from 'lucide-react';

// Backend API URL (change as needed for production)
const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

type WhatsAppStatus = 'disconnected' | 'qr_received' | 'initializing' | 'connected' | 'authenticated' | 'auth_failure';

const Index = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<WhatsAppStatus>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Form state
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Connect to Socket.io
    const socket = io(SOCKET_URL);
    
    // Listen for QR code events
    socket.on('qrCode', (qrCodeDataUrl: string) => {
      setQrCode(qrCodeDataUrl);
      setStatus('qr_received');
      setLoading(false);
    });
    
    // Listen for status updates
    socket.on('status', (data: { status: WhatsAppStatus, message: string }) => {
      setStatus(data.status);
      setLoading(false);
      
      // If connected, clear QR code
      if (data.status === 'connected') {
        setQrCode(null);
        toast({
          title: "WhatsApp Connected",
          description: "Your WhatsApp account is now connected!",
        });
      }
    });
    
    // Check initial status
    checkStatus();
    
    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);
  
  // Function to check WhatsApp connection status
  const checkStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/status`);
      setStatus(response.data.status);
      setLoading(false);
      
      // If already connected, no need to show QR code
      if (response.data.status === 'connected') {
        setQrCode(null);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setLoading(false);
    }
  };
  
  // Function to send a WhatsApp message
  const sendWhatsAppMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !message) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both phone number and message.",
      });
      return;
    }
    
    setSending(true);
    
    try {
      const response = await axios.post(`${API_URL}/send_message`, {
        phone,
        message
      });
      
      if (response.data.success) {
        toast({
          title: "Message Sent",
          description: "Your WhatsApp message was sent successfully!",
        });
        setMessage(''); // Clear message field after sending
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Message Failed",
        description: "Failed to send your WhatsApp message. Please check connection and try again.",
      });
    } finally {
      setSending(false);
    }
  };
  
  // Function to logout and clear session
  const handleLogout = async () => {
    setLoggingOut(true);
    
    try {
      const response = await axios.get(`${API_URL}/logout`);
      
      if (response.data.success) {
        toast({
          title: "Logged Out",
          description: "WhatsApp session has been logged out.",
        });
        setStatus('disconnected');
        // Reset state
        setQrCode(null);
      }
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
      });
    } finally {
      setLoggingOut(false);
    }
  };
  
  // Helper function to render status UI
  const renderStatusIndicator = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <Wifi className="h-5 w-5" />
            <span className="font-medium">Connected</span>
          </div>
        );
      case 'authenticated':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <Wifi className="h-5 w-5" />
            <span className="font-medium">Authenticated</span>
          </div>
        );
      case 'initializing':
        return (
          <div className="flex items-center space-x-2 text-yellow-600">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="font-medium">Initializing...</span>
          </div>
        );
      case 'disconnected':
      default:
        return (
          <div className="flex items-center space-x-2 text-gray-500">
            <WifiOff className="h-5 w-5" />
            <span className="font-medium">Disconnected</span>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">WhatsApp API Connection</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code & Status Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>WhatsApp Connection</CardTitle>
            <CardDescription>Connect your WhatsApp account by scanning the QR code</CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center">
            {loading ? (
              <div className="w-64 h-64 flex items-center justify-center">
                <Skeleton className="h-[250px] w-[250px]" />
              </div>
            ) : qrCode ? (
              <div className="mb-6">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 border" />
                <p className="text-center text-sm mt-2 text-gray-600">
                  Scan with WhatsApp on your phone
                </p>
              </div>
            ) : (
              <div className="w-64 h-64 flex flex-col items-center justify-center border border-dashed rounded-lg">
                {status === 'connected' ? (
                  <div className="text-center">
                    <Smartphone className="h-16 w-16 mx-auto text-green-500 mb-3" />
                    <p className="text-lg font-medium">WhatsApp Connected</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Your WhatsApp account is connected and ready to use
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Smartphone className="h-16 w-16 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Waiting for connection...</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-6 w-full">
              <Alert>
                <AlertDescription className="flex justify-between items-center">
                  <span>Status: {renderStatusIndicator()}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    disabled={status !== 'connected' || loggingOut}
                  >
                    {loggingOut ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
                    Logout
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
        
        {/* Message Sender Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Send WhatsApp Message</CardTitle>
            <CardDescription>Send messages to any WhatsApp number</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={sendWhatsAppMessage}>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890 (with country code)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={status !== 'connected'}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={status !== 'connected'}
                    className="min-h-[120px]"
                    required
                  />
                </div>
              </div>
              
              <CardFooter className="flex justify-between px-0 pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={status !== 'connected' || sending}
                >
                  {sending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;

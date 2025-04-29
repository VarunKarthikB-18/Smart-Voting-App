import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function VerificationFailedPage() {
  const [, navigate] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();
  const errorMessage = sessionStorage.getItem('verificationError') || 'Face verification failed. Please try again.';

  // Automatically trigger logout when this page is shown
  useEffect(() => {
    const timer = setTimeout(() => {
      handleLogout();
    }, 5000); // Wait 5 seconds before logging out

    return () => {
      clearTimeout(timer);
      // Clear any stored verification data on unmount
      sessionStorage.removeItem('verificationError');
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Clear any stored verification data
      sessionStorage.removeItem('verificationError');
      
      // Clear any stored auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Call the logout function
      await logout();
      
      // Show logout message
      toast({
        title: "Logged Out",
        description: "You have been logged out for security reasons.",
        variant: "destructive"
      });

      // Force navigation to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error during logout:', error);
      // Force navigation to auth page even if logout fails
      window.location.href = '/auth';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center text-destructive gap-2">
            <XCircle className="h-8 w-8" />
            <span>Security Alert</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-6">
              {errorMessage}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              For security reasons, you will be automatically logged out in 5 seconds.
            </p>
            <p className="text-sm text-gray-500">
              Please ensure you are using the correct account and the same face that was registered.
            </p>
          </div>
          
          <Button 
            onClick={handleLogout}
            variant="destructive"
            className="w-full flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Return to Voting Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 
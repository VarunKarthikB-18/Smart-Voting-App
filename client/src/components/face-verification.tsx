import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { initializeFaceApi } from '@/lib/face-api-init';

interface FaceVerificationProps {
  onVerificationComplete: () => void;
  onCancel: () => void;
}

export function FaceVerification({ onVerificationComplete, onCancel }: FaceVerificationProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await initializeFaceApi();
        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing face detection:', error);
        if (mounted) {
          setError('Failed to load face detection models. Please refresh and try again.');
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !error) {
      startVideo();
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isLoading, error]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Unable to access camera. Please check permissions.');
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const verifyFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsVerifying(true);
    try {
      // Get face detection with landmarks and descriptors
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        toast({
          title: 'No Face Detected',
          description: 'Please ensure your face is clearly visible.',
          variant: 'destructive'
        });
        setIsVerifying(false);
        return;
      }

      // Send face data for verification
      const response = await apiRequest('POST', '/api/face/verify', {
        faceDescriptor: Array.from(detection.descriptor)

      });
      
      
      const result = await response.json();
      console.log(result);
      
      if (result.verified) {
        toast({
          title: 'Verification Successful',
          description: 'Your identity has been verified.',
        });
        onVerificationComplete();
      } else {
        toast({
          title: 'Verification Failed',
          description: result.message || 'Face verification failed. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Face verification error:', error);
      toast({
        title: 'Verification Error',
        description: 'An error occurred during face verification. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-destructive mb-4">
          <span className="text-lg">⚠️ {error}</span>
        </div>
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="relative aspect-video mb-4 bg-muted rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading face detection...</span>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
          </>
        )}
      </div>
      
      <div className="flex justify-between gap-4">
        <Button
          onClick={onCancel}
          variant="secondary"
          disabled={isVerifying}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={verifyFace}
          disabled={isLoading || isVerifying}
          className="flex-1"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Verify Face
            </>
          )}
        </Button>
      </div>
    </Card>
  );
} 
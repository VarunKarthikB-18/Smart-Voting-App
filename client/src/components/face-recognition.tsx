import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, CheckCircle2, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FaceRecognitionProps {
  onFaceVerified: (faceDescriptor: Float32Array) => void;
  onCancel: () => void;
  onVerificationFailed?: (message: string) => void;
}

interface FaceVerificationResponse {
  verified: boolean;
  message?: string;
}

export function FaceRecognition({ onFaceVerified, onCancel, onVerificationFailed }: FaceRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const resetVerificationState = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVerificationFailed(false);
    setFaceDetected(false);
    setIsVerifying(false);
    setFailureMessage('');
  };

  const handleVerificationFailure = (message: string) => {
    console.log("Setting verification failed state with message:", message);
    setVerificationFailed(true);
    setFaceDetected(false);
    setIsVerifying(false);
    setFailureMessage(message);
    
    // Show toast after setting state
    toast({
      title: 'Failed to Verify',
      description: message,
      variant: 'destructive'
    });
    
    // Notify parent component about verification failure
    if (onVerificationFailed) {
      onVerificationFailed(message);
    }
    
    // Keep the failure state for longer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      console.log("Resetting verification failed state");
      resetVerificationState();
      // Also notify parent about reset if needed
      if (onVerificationFailed) {
        onVerificationFailed('');
      }
    }, 5000);
  };

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Use a specific version of the models known to work
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        
        // Load models one by one with better error handling
        try {
          console.log('Loading TinyFaceDetector model...');
          await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
          console.log('TinyFaceDetector model loaded successfully');
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to load TinyFaceDetector model: ${errorMessage}`);
        }
        
        try {
          console.log('Loading FaceLandmark68 model...');
          await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
          console.log('FaceLandmark68 model loaded successfully');
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to load FaceLandmark68 model: ${errorMessage}`);
        }
        
        try {
          console.log('Loading FaceRecognition model...');
          await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
          console.log('FaceRecognition model loaded successfully');
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to load FaceRecognition model: ${errorMessage}`);
        }
        
        setModelsLoaded(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading face detection models:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load face detection models: ${errorMessage}`);
        setIsLoading(false);
      }
    };
    loadModels();
  }, []);

  // Start video when models are loaded
  useEffect(() => {
    if (modelsLoaded) {
      startVideo();
    }
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [modelsLoaded]);

  const startVideo = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraPermission(true);
        }
      } else {
        setError('Your browser does not support camera access.');
        setCameraPermission(false);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access your camera. Please allow camera permissions and try again.');
      setCameraPermission(false);
    }
  };

  const verifyFace = async () => {
    if (!videoRef.current || !canvasRef.current || isVerifying) return;
    
    resetVerificationState();
    setIsVerifying(true);
    
    try {
      console.log("Starting face verification...");
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        handleVerificationFailure('Please ensure your face is clearly visible.');
        return;
      }

      console.log("Face detected, descriptor length:", detection.descriptor.length);
      setFaceDetected(true);

      const descriptorArray = detection.descriptor;
      console.log("Descriptor array length:", descriptorArray.length);
      console.log("Descriptor array is valid:", descriptorArray.length === 128);

      try {
        console.log("Sending verification request...");
        const response = await apiRequest('POST', '/api/face/verify', {
          faceDescriptor: Array.from(descriptorArray)
        });

        const result = await response.json() as FaceVerificationResponse;
        console.log("Verification response:", result);

        if (result.verified) {
          toast({
            title: 'Success',
            description: 'Face verification successful.',
          });

          // Stop the video stream
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());

          // Call the completion handler with the face descriptor
          onFaceVerified(descriptorArray);
        } else {
          handleVerificationFailure(result.message || 'Face verification failed. The face does not match the registered face.');
        }
      } catch (error) {
        console.error('Error verifying face:', error);
        handleVerificationFailure(error instanceof Error ? error.message : 'Face verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      handleVerificationFailure(error instanceof Error ? error.message : 'Failed to capture face. Please try again.');
    }
  };

  // Detect faces continuously when video is playing
  useEffect(() => {
    if (!modelsLoaded || !videoRef.current || !canvasRef.current || !cameraPermission) return;

    let animationFrameId: number;
    let isDetecting = false;
    
    const detectFaces = async () => {
      if (isDetecting || !videoRef.current || !canvasRef.current || faceDetected || isVerifying || verificationFailed) {
        animationFrameId = requestAnimationFrame(detectFaces);
        return;
      }

      // Ensure video is actually playing and has valid dimensions
      if (videoRef.current.readyState !== 4 || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
        animationFrameId = requestAnimationFrame(detectFaces);
        return;
      }

      isDetecting = true;
      
      try {
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        };

        // Ensure canvas dimensions match video
        if (canvasRef.current.width !== displaySize.width || canvasRef.current.height !== displaySize.height) {
          canvasRef.current.width = displaySize.width;
          canvasRef.current.height = displaySize.height;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) {
          console.error('Failed to get canvas context');
          isDetecting = false;
          animationFrameId = requestAnimationFrame(detectFaces);
          return;
        }

        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );

        if (detection && canvas) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          
          // Only resize and draw if we have valid dimensions
          if (displaySize.width > 0 && displaySize.height > 0) {
            const detectionForSize = faceapi.resizeResults(detection, displaySize);
            faceapi.draw.drawDetections(canvas, [detectionForSize]);
          }
        }
      } catch (error) {
        console.error('Error in face detection:', error);
      } finally {
        isDetecting = false;
        animationFrameId = requestAnimationFrame(detectFaces);
      }
    };
    
    detectFaces();
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [modelsLoaded, cameraPermission, faceDetected, isVerifying, verificationFailed]);

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-center">
          {verificationFailed ? (
            <div className="text-destructive flex items-center justify-center gap-2">
              <XCircle className="h-6 w-6" />
              Failed to Verify
            </div>
          ) : (
            'Face Verification'
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
              {verificationFailed && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="bg-destructive text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-2">
                    <XCircle className="h-6 w-6" />
                    <span className="text-lg font-semibold">Verification Failed</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {verificationFailed && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-center text-destructive">
            <p className="font-semibold">Face verification failed</p>
            <p className="text-sm mt-1">{failureMessage}</p>
          </div>
        )}

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
            disabled={isLoading || isVerifying || verificationFailed}
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
      </CardContent>
    </Card>
  );
}
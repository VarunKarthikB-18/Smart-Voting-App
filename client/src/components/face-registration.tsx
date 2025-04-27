import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, CheckCircle2, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FaceRegistrationProps {
  onRegistrationComplete: () => void;
  onCancel: () => void;
}

interface FaceRegistrationResponse {
  faceRegistered: boolean;
  message?: string;
}

export function FaceRegistration({ onRegistrationComplete, onCancel }: FaceRegistrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Loading face detection models...");
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

  const registerFace = async () => {
    if (!videoRef.current || !canvasRef.current || isRegistering) return;
    
    setIsRegistering(true);
    try {
      console.log("Starting face registration...");
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
        setIsRegistering(false);
        return;
      }

      console.log("Face detected, descriptor length:", detection.descriptor.length);
      setFaceDetected(true);

      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const context = canvas.getContext('2d');
      if (!context) {
        console.error("Failed to get canvas context");
        return;
      }
      
      context.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');

      // Send face data for registration
      try {
        console.log("Sending registration request...");
        const response = await apiRequest('POST', '/api/face/register', {
          faceDescriptor: Array.from(detection.descriptor),
          faceImage: imageData
        });

        const result = await response.json() as FaceRegistrationResponse;
        console.log("Registration response:", result);

        if (result.faceRegistered) {
          toast({
            title: 'Success',
            description: 'Face registration successful.',
          });

          // Stop the video stream
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());

          // Call the completion handler
          onRegistrationComplete();
        } else {
          toast({
            title: 'Registration Failed',
            description: result.message || 'Face registration failed. Please try again.',
            variant: 'destructive'
          });
          setFaceDetected(false);
        }
      } catch (error) {
        console.error('Error registering face:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to register face. Please try again.',
          variant: 'destructive'
        });
        setFaceDetected(false);
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to capture face. Please try again.',
        variant: 'destructive'
      });
      setFaceDetected(false);
    }
    setIsRegistering(false);
  };

  // Detect faces continuously when video is playing
  useEffect(() => {
    if (!modelsLoaded || !videoRef.current || !canvasRef.current || !cameraPermission) return;

    let animationFrameId: number;
    let isDetecting = false;
    
    const detectFaces = async () => {
      if (isDetecting || !videoRef.current || !canvasRef.current || faceDetected || isRegistering) {
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
  }, [modelsLoaded, cameraPermission, faceDetected, isRegistering]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Face Registration</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading face detection models...</span>
          </div>
        )}

        {error && (
          <div className="text-center text-red-500 p-6">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        )}
        
        {!isLoading && !error && (
          <>
            <div className="relative bg-gray-100 rounded-md overflow-hidden">
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
              
              {faceDetected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="bg-white p-4 rounded-md shadow-lg flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                    <span>Face detected! Registering...</span>
                  </div>
                </div>
              )}
              
              {!faceDetected && cameraPermission && (
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center">
                  <Camera className="w-4 h-4 mr-1" />
                  <span>Look at the camera</span>
                </div>
              )}
            </div>
            
            <div className="text-center text-sm text-gray-500 mt-2">
              {!faceDetected ? (
                <p>Please position your face in the frame for registration</p>
              ) : (
                <p>Face detected! Registering your face data...</p>
              )}
            </div>
            
            <div className="flex justify-between mt-4">
              <Button 
                variant="outline" 
                onClick={onCancel}
                disabled={isRegistering}
              >
                Cancel
              </Button>
              
              <Button 
                variant="default"
                disabled={!cameraPermission || isRegistering}
                onClick={registerFace}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Register Face
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 
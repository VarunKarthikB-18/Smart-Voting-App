import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, CheckCircle2, XCircle } from 'lucide-react';

interface FaceRecognitionProps {
  onFaceVerified: () => void;
  onCancel: () => void;
}

export function FaceRecognition({ onFaceVerified, onCancel }: FaceRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        // Load models from public directory
        const MODEL_URL = '/models';
        
        // We need to create a models directory in the public folder
        // and add the face-api.js models there in a real production app
        
        // For this demo, we'll simulate model loading
        // In a real app, you would uncomment these lines:
        /*
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        */
        
        // Simulate model loading
        await new Promise(resolve => setTimeout(resolve, 1500));
        setModelsLoaded(true);
        startVideo();
      } catch (err) {
        setError('Failed to load facial recognition models. Please try again later.');
        console.error('Error loading models:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
    
    return () => {
      // Clean up camera access when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

  // Detect faces when video is playing
  const handleVideoPlay = () => {
    if (!modelsLoaded || !videoRef.current || !canvasRef.current) return;
    
    const displaySize = {
      width: videoRef.current.width,
      height: videoRef.current.height
    };
    
    faceapi.matchDimensions(canvasRef.current, displaySize);
    
    let verificationTriggered = false;
    
    const intervalId = setInterval(async () => {
      // In a real app, this would use actual face detection:
      // const detections = await faceapi.detectAllFaces(
      //   videoRef.current as HTMLVideoElement,
      //   new faceapi.TinyFaceDetectorOptions()
      // ).withFaceLandmarks();
      
      // For this demo, we'll simulate face detection with a timer
      if (!verificationTriggered) {
        setTimeout(() => {
          setFaceDetected(true);
          clearInterval(intervalId);
          
          // Auto-verify after 2 seconds of face detection
          // Prevent multiple verification attempts
          if (!verificationTriggered) {
            verificationTriggered = true;
            setTimeout(() => {
              onFaceVerified();
            }, 2000);
          }
        }, 3000);
      }
    }, 100);
    
    return () => clearInterval(intervalId);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Face Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-6">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            <p className="text-gray-500">Loading facial recognition...</p>
          </div>
        )}
        
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center p-6">
            <XCircle className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-red-500 text-center">{error}</p>
            <Button 
              variant="outline"
              className="mt-4"
              onClick={onCancel}
            >
              Go Back
            </Button>
          </div>
        )}
        
        {!isLoading && !error && (
          <>
            <div className="relative bg-gray-100 rounded-md overflow-hidden">
              <video
                ref={videoRef}
                width="100%"
                height="auto"
                autoPlay
                muted
                onPlay={handleVideoPlay}
                className="rounded-md"
              />
              <canvas 
                ref={canvasRef} 
                className="absolute top-0 left-0 w-full h-full"
              />
              
              {faceDetected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="bg-white p-4 rounded-md shadow-lg flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                    <span>Face verified! Processing your vote...</span>
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
            
            <div className="text-center text-sm text-gray-500">
              {!faceDetected ? (
                <p>Please position your face in the frame for verification</p>
              ) : (
                <p>Face detected! Verifying your identity...</p>
              )}
            </div>
            
            <div className="flex justify-between mt-4">
              <Button 
                variant="outline" 
                onClick={onCancel}
              >
                Cancel
              </Button>
              
              {!faceDetected && (
                <Button 
                  variant="default"
                  disabled={!cameraPermission}
                  onClick={() => {
                    // For demo purposes, simulate face detection
                    setFaceDetected(true);
                    
                    // Use a single timeout to prevent multiple calls
                    setTimeout(() => {
                      onFaceVerified();
                    }, 2000);
                  }}
                >
                  Skip Verification
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
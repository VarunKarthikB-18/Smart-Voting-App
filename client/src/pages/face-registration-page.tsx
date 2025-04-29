import React from 'react';
import { FaceRegistration } from '@/components/face-registration';

interface FaceRegistrationPageProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

function FaceRegistrationPage({ onComplete, onCancel }: FaceRegistrationPageProps) {
  const handleRegistrationComplete = () => {
    // Check if there's a pending vote
    const pendingVoteCandidate = sessionStorage.getItem('pendingVoteCandidate');
    
    if (pendingVoteCandidate) {
      // Clear the pending vote
      sessionStorage.removeItem('pendingVoteCandidate');
      // Redirect back to voting page
      window.location.href = '/';
    } else {
      onComplete?.();
    }
  };

  const handleCancel = () => {
    // Clear any pending vote
    sessionStorage.removeItem('pendingVoteCandidate');
    onCancel?.();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Face Registration</h1>
        <p className="text-gray-600">
          Please register your face to enable secure voting. Make sure you are in a well-lit area
          and your face is clearly visible to the camera.
        </p>
      </div>

      <FaceRegistration
        onRegistrationComplete={handleRegistrationComplete}
        onCancel={handleCancel}
      />

      <div className="mt-8 text-sm text-gray-500">
        <h2 className="font-semibold mb-2">Privacy Notice</h2>
        <p>
          Your face data is securely stored and used only for verification during the voting process.
          The data is encrypted and will be automatically deleted after the election period ends.
        </p>
      </div>
    </div>
  );
}

export default FaceRegistrationPage; 
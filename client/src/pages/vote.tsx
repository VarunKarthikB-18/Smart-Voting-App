import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CandidateCard } from '@/components/candidate-card';
import { FaceRecognition } from '@/components/face-recognition';
import { fetchCandidates, castVote, hasVoted, markAsVoted, getVotedCandidate } from '@/lib/api';
import { AlertCircleIcon, CheckCircleIcon, ScanFaceIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function VotePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [showVoteSuccess, setShowVoteSuccess] = useState(false);
  const [showVoteError, setShowVoteError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error occurred while casting your vote.");
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  
  // Get auth context for user data
  const { user } = useAuth();
  
  // Check if user has voted - ONLY use server data
  // This fixes an issue where localStorage might incorrectly show a user has voted
  const userHasVoted = user ? user.hasVoted : false;
  
  // Get the candidate the user voted for - ONLY use server data
  const userVotedFor = user ? user.votedFor : null;
  
  // Fetch candidates
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['/api/candidates'],
    queryFn: fetchCandidates
  });
  
  // Cast vote mutation
  const voteMutation = useMutation({
    mutationFn: (candidateId: number) => castVote(candidateId),
    onSuccess: (data, candidateId) => {
      // Update cache for both results and user data
      queryClient.invalidateQueries({ queryKey: ['/api/results'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      // Mark as voted in localStorage as backup
      markAsVoted(candidateId);
      
      // Show success message
      setShowVoteSuccess(true);
      setShowVoteError(false);
      
      // Redirect to results page after delay
      setTimeout(() => {
        navigate('/results');
      }, 2000);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || "An error occurred while casting your vote.");
      setShowVoteError(true);
      setShowVoteSuccess(false);
      
      toast({
        title: "Error",
        description: error.message || "An error occurred while casting your vote.",
        variant: "destructive"
      });
    }
  });
  
  const handleVote = (candidateId: number) => {
    if (userHasVoted) {
      setErrorMessage("You have already cast your vote.");
      setShowVoteError(true);
      return;
    }
    
    // Set the selected candidate id
    setSelectedCandidateId(candidateId);
    
    // Show face verification
    setShowFaceVerification(true);
  };
  
  const handleFaceVerified = () => {
    // After face verification succeeds, cast the vote
    if (selectedCandidateId !== null && !voteMutation.isPending) {
      voteMutation.mutate(selectedCandidateId);
      setShowFaceVerification(false);
    }
  };
  
  const handleCancelFaceVerification = () => {
    setShowFaceVerification(false);
    setSelectedCandidateId(null);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showFaceVerification ? (
        <div className="my-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Identity</h2>
            <p className="text-gray-500">
              Please complete the face verification to confirm your vote
            </p>
          </div>
          <FaceRecognition 
            onFaceVerified={handleFaceVerified} 
            onCancel={handleCancelFaceVerification} 
          />
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cast Your Vote</h2>
            <p className="text-gray-500 dark:text-gray-300">
              Select one candidate to vote for in this election. Face verification will be required.
            </p>
            <div className="mt-2 flex items-center text-sm text-primary">
              <ScanFaceIcon className="h-4 w-4 mr-1" />
              <span>Facial verification required for voting</span>
            </div>
          </div>
          
          {/* Vote Status Alert */}
          {showVoteSuccess && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
              <AlertDescription className="text-green-800">
                Your vote has been recorded. Thank you for participating!
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error Alert */}
          {showVoteError && (
            <Alert className="mb-6 bg-red-50 border-red-200" variant="destructive">
              <AlertCircleIcon className="h-4 w-4 text-red-600 mr-2" />
              <AlertDescription className="text-red-800">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm p-5 animate-pulse">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="ml-4">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-5"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          )}
          
          {/* Candidate List */}
          {!isLoading && candidates && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate) => (
                <CandidateCard 
                  key={candidate.id}
                  candidate={candidate}
                  onVote={handleVote}
                  hasVoted={userHasVoted}
                  votedForThisCandidate={userVotedFor === candidate.id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

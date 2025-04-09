import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/custom-avatar";
import { Candidate } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CandidateCardProps {
  candidate: Candidate;
  onVote: (candidateId: number) => void;
  hasVoted: boolean;
  votedForThisCandidate: boolean;
}

export function CandidateCard({ candidate, onVote, hasVoted, votedForThisCandidate }: CandidateCardProps) {
  const handleVote = () => {
    onVote(candidate.id);
  };

  // Generate initials for avatar fallback
  const initials = candidate.name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center mb-4">
          <Avatar 
            src={candidate.avatarUrl} 
            alt={candidate.name}
            fallback={initials}
            size="lg"
          />
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{candidate.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-300">{candidate.party}</p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-200 text-sm mb-5">{candidate.slogan}</p>
        <Button
          variant={votedForThisCandidate ? "secondary" : "default"}
          className={cn(
            "w-full", 
            hasVoted && !votedForThisCandidate && "bg-gray-400 hover:bg-gray-400"
          )}
          onClick={handleVote}
          disabled={hasVoted}
        >
          {votedForThisCandidate 
            ? "Your vote" 
            : hasVoted 
              ? "Already voted" 
              : `Vote for this candidate`}
        </Button>
      </CardContent>
    </Card>
  );
}

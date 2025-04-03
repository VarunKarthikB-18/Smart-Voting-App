import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/custom-avatar";
import { VoteResult } from '@/lib/types';

interface ResultCardProps {
  result: VoteResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const { candidate, votes, percentage } = result;
  
  // Generate initials for avatar fallback
  const initials = candidate.name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  return (
    <div className="result-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Avatar 
            src={candidate.avatarUrl} 
            alt={candidate.name}
            fallback={initials}
            size="sm"
            className="mr-3"
          />
          <div className="text-sm font-medium">{candidate.name}</div>
        </div>
        <div className="text-lg font-bold">{percentage}%</div>
      </div>
      <Progress value={percentage} className="h-2.5 mb-1" />
      <div className="text-xs text-gray-500">{votes} votes</div>
    </div>
  );
}

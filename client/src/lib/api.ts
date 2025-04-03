import { Candidate, ElectionResults } from './types';
import { apiRequest } from './queryClient';

// Fetch all candidates
export async function fetchCandidates(): Promise<Candidate[]> {
  const response = await fetch('/api/candidates');
  if (!response.ok) {
    throw new Error('Failed to fetch candidates');
  }
  return response.json();
}

// Fetch election results
export async function fetchResults(): Promise<ElectionResults> {
  const response = await fetch('/api/results');
  if (!response.ok) {
    throw new Error('Failed to fetch election results');
  }
  return response.json();
}

// Cast a vote for a candidate
export async function castVote(candidateId: number): Promise<{ message: string; results: ElectionResults }> {
  const response = await apiRequest('POST', '/api/vote', { candidateId });
  return response.json();
}

// Check if the user has already voted
// This function is used as a fallback when the user context is not available
export function hasVoted(): boolean {
  return localStorage.getItem('hasVoted') === 'true';
}

// Mark the user as having voted
export function markAsVoted(candidateId: number): void {
  localStorage.setItem('hasVoted', 'true');
  localStorage.setItem('votedFor', candidateId.toString());
}

// Get the ID of the candidate the user voted for
export function getVotedCandidate(): number | null {
  const votedFor = localStorage.getItem('votedFor');
  return votedFor ? parseInt(votedFor, 10) : null;
}

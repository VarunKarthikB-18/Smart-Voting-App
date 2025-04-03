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

// IMPORTANT: These localStorage methods are only used as a fallback
// The primary source of truth is the server's user data
// They should only be used when the server data is unavailable or as a temporary cache

// Check if the user has already voted
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

// Clear all vote data from localStorage
// Used during logout to prevent stale data
export function clearVoteData(): void {
  localStorage.removeItem('hasVoted');
  localStorage.removeItem('votedFor');
}

// Client-side types
export interface Candidate {
  id: number;
  name: string;
  party: string;
  slogan: string;
  avatarUrl: string;
}

export interface VoteResult {
  candidate: Candidate;
  votes: number;
  percentage: number;
}

export interface ElectionResults {
  totalVotes: number;
  results: VoteResult[];
  leadingCandidate?: VoteResult;
}

export type Tab = 'voting' | 'results' | 'info';

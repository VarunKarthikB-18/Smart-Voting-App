import { 
  users, 
  candidates, 
  votes, 
  type User, 
  type InsertUser, 
  type Candidate, 
  type InsertCandidate,
  type Vote,
  type InsertVote,
  type VoteResult,
  type ElectionSummary
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserVote(userId: number, candidateId: number): Promise<User>;
  hasUserVoted(userId: number): Promise<boolean>;
  
  // Candidate operations
  getCandidates(): Promise<Candidate[]>;
  getCandidate(id: number): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  
  // Vote operations
  castVote(vote: InsertVote, userId?: number): Promise<Vote>;
  getVotesForCandidate(candidateId: number): Promise<number>;
  getElectionResults(): Promise<ElectionSummary>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private candidates: Map<number, Candidate>;
  private votes: Map<number, Vote>;
  
  private userId: number;
  private candidateId: number;
  private voteId: number;
  
  constructor() {
    this.users = new Map();
    this.candidates = new Map();
    this.votes = new Map();
    
    this.userId = 1;
    this.candidateId = 1;
    this.voteId = 1;
    
    // Initialize with default candidates
    this.initializeCandidates();
  }
  
  private initializeCandidates() {
    const defaultCandidates: InsertCandidate[] = [
      {
        name: "Alexander Mitchell",
        party: "Progressive Party",
        slogan: "Building a better future together",
        avatarUrl: "https://ui-avatars.com/api/?background=random&name=Alexander+Mitchell"
      },
      {
        name: "Sophia Rodriguez",
        party: "Liberty Alliance",
        slogan: "Freedom and prosperity for all",
        avatarUrl: "https://ui-avatars.com/api/?background=random&name=Sophia+Rodriguez"
      },
      {
        name: "Michael Thompson",
        party: "National Unity",
        slogan: "Bringing the nation together",
        avatarUrl: "https://ui-avatars.com/api/?background=random&name=Michael+Thompson"
      },
      {
        name: "Olivia Washington",
        party: "Green Future",
        slogan: "Sustainability for generations to come",
        avatarUrl: "https://ui-avatars.com/api/?background=random&name=Olivia+Washington"
      }
    ];
    
    defaultCandidates.forEach(candidate => {
      this.createCandidate(candidate);
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id, 
      hasVoted: false,
      votedFor: null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserVote(userId: number, candidateId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser: User = {
      ...user,
      hasVoted: true,
      votedFor: candidateId
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async hasUserVoted(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    return user ? user.hasVoted : false;
  }
  
  // Candidate operations
  async getCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }
  
  async getCandidate(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }
  
  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = this.candidateId++;
    const candidate: Candidate = { ...insertCandidate, id };
    this.candidates.set(id, candidate);
    return candidate;
  }
  
  // Vote operations
  async castVote(insertVote: InsertVote, userId?: number): Promise<Vote> {
    const id = this.voteId++;
    const vote: Vote = {
      ...insertVote,
      id,
      userId: userId || null,
      timestamp: new Date().toISOString()
    };
    
    // Check if candidate exists
    const candidate = await this.getCandidate(insertVote.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    // If userId is provided, update user's vote status
    if (userId) {
      const hasVoted = await this.hasUserVoted(userId);
      if (hasVoted) {
        throw new Error("User has already voted");
      }
      await this.updateUserVote(userId, insertVote.candidateId);
    }
    
    this.votes.set(id, vote);
    return vote;
  }
  
  async getVotesForCandidate(candidateId: number): Promise<number> {
    return Array.from(this.votes.values()).filter(
      vote => vote.candidateId === candidateId
    ).length;
  }
  
  async getElectionResults(): Promise<ElectionSummary> {
    const candidates = await this.getCandidates();
    const totalVotes = this.votes.size;
    
    if (totalVotes === 0) {
      return {
        totalVotes: 0,
        results: candidates.map(candidate => ({
          candidate,
          votes: 0,
          percentage: 0
        }))
      };
    }
    
    const results: VoteResult[] = [];
    
    for (const candidate of candidates) {
      const voteCount = await this.getVotesForCandidate(candidate.id);
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
      
      results.push({
        candidate,
        votes: voteCount,
        percentage
      });
    }
    
    // Sort by votes (descending)
    results.sort((a, b) => b.votes - a.votes);
    
    // Determine leading candidate if there are any votes
    const leadingCandidate = results[0]?.votes > 0 ? results[0] : undefined;
    
    return {
      totalVotes,
      results,
      leadingCandidate
    };
  }
}

export const storage = new MemStorage();

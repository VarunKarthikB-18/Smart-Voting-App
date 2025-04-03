import { 
  users, 
  candidates, 
  votes, 
  sessions,
  type User, 
  type InsertUser, 
  type Candidate, 
  type InsertCandidate,
  type Vote,
  type InsertVote,
  type Session,
  type InsertSession,
  type VoteResult,
  type ElectionSummary
} from "@shared/schema";
import session from 'express-session';

// Interface for storage operations
export interface IStorage {
  // Session store for express-session
  sessionStore?: session.Store;
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail?(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserVote(userId: number, candidateId: number): Promise<User>;
  hasUserVoted(userId: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>; // Added for admin functionality
  
  // Face recognition operations
  saveFaceData?(userId: number, faceData: any): Promise<User>;
  getFaceData?(userId: number): Promise<any>;
  isUserFaceRegistered?(userId: number): Promise<boolean>;
  
  // Session operations
  createSession?(insertSession: InsertSession): Promise<Session>;
  getSessionByToken?(token: string): Promise<Session | undefined>;
  deleteSession?(token: string): Promise<void>;
  
  // Candidate operations
  getCandidates(): Promise<Candidate[]>;
  getCandidate(id: number): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, candidate: InsertCandidate): Promise<Candidate>; // Added for admin functionality
  deleteCandidate(id: number): Promise<void>; // Added for admin functionality
  
  // Vote operations
  castVote(vote: InsertVote, userId?: number): Promise<Vote>;
  getVotesForCandidate(candidateId: number): Promise<number>;
  getElectionResults(): Promise<ElectionSummary>;
}

// Import memory store
import createMemoryStore from 'memorystore';

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private candidates: Map<number, Candidate>;
  private votes: Map<number, Vote>;
  
  sessionStore: session.Store;
  
  private userId: number;
  private candidateId: number;
  private voteId: number;
  
  constructor() {
    // Initialize in-memory data stores
    this.users = new Map();
    this.candidates = new Map();
    this.votes = new Map();
    
    this.userId = 1;
    this.candidateId = 1;
    this.voteId = 1;
    
    // Create memory store for sessions
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
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
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      hasVoted: false,
      votedFor: null,
      faceData: null,
      faceRegistered: false,
      role: "voter", // Set default role to voter
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  // Get all users (for admin functionality)
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
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
  
  // Face recognition operations
  async saveFaceData(userId: number, faceData: any): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser: User = {
      ...user,
      faceData,
      faceRegistered: true
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getFaceData(userId: number): Promise<any> {
    const user = await this.getUser(userId);
    return user?.faceData;
  }
  
  async isUserFaceRegistered(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    // Since faceRegistered is notNull in schema, we can safely return the value or false if user not found
    return user?.faceRegistered ?? false;
  }
  
  // Session operations
  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = Math.floor(Math.random() * 1000000);
    const session: Session = {
      ...insertSession,
      id,
      createdAt: new Date()
    };
    
    // In memory, we don't actually store sessions
    return session;
  }
  
  async getSessionByToken(token: string): Promise<Session | undefined> {
    // In memory, we don't actually verify sessions
    // Just return a dummy valid session
    return {
      id: 1,
      userId: 1,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h in the future
    };
  }
  
  async deleteSession(token: string): Promise<void> {
    // In memory, we don't actually delete sessions
    return;
  }
  
  // Email-based user lookup
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.email === email
    );
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
  
  // Update a candidate (for admin functionality)
  async updateCandidate(id: number, candidateData: InsertCandidate): Promise<Candidate> {
    const candidate = await this.getCandidate(id);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    const updatedCandidate: Candidate = {
      ...candidate,
      ...candidateData,
    };
    
    this.candidates.set(id, updatedCandidate);
    return updatedCandidate;
  }
  
  // Delete a candidate (for admin functionality)
  async deleteCandidate(id: number): Promise<void> {
    const candidate = await this.getCandidate(id);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    // Delete the candidate
    this.candidates.delete(id);
    
    // Delete all votes for this candidate
    const votesToDelete: number[] = [];
    this.votes.forEach((vote, voteId) => {
      if (vote.candidateId === id) {
        votesToDelete.push(voteId);
      }
    });
    
    votesToDelete.forEach(voteId => {
      this.votes.delete(voteId);
    });
  }
  
  // Vote operations
  async castVote(insertVote: InsertVote, userId?: number): Promise<Vote> {
    const id = this.voteId++;
    const vote: Vote = {
      ...insertVote,
      id,
      userId: userId || null,
      timestamp: new Date()
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

// Import PgStorage implementation
import { PgStorage } from './pg-storage';

// Use PostgreSQL storage instead of in-memory storage
export const storage = new PgStorage();

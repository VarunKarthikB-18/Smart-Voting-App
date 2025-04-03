import { InsertUser, User, InsertCandidate, Candidate, InsertVote, Vote, InsertSession, Session, ElectionSummary, VoteResult } from "@shared/schema";
import { db } from "./db";
import { and, eq, desc, sql as sqlExpr } from "drizzle-orm";
import { users, candidates, votes, sessions } from "@shared/schema";
import { IStorage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Create a PostgreSQL session store
const PostgresSessionStore = connectPg(session);

// Implement the storage interface for PostgreSQL
export class PgStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize the session store with a pg connection
    this.sessionStore = new PostgresSessionStore({ 
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      tableName: 'session',  // Use the default table name
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Add default values - temporarily remove role until we run the migration
    const userWithDefaults = {
      ...insertUser,
      hasVoted: false,
      votedFor: null,
      faceData: null,
      faceRegistered: false,
      // Don't set role explicitly, use the database default
    };
    
    const [user] = await db.insert(users).values(userWithDefaults).returning();
    return user;
  }
  
  // Get all users (for admin functionality)
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserVote(userId: number, candidateId: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ hasVoted: true, votedFor: candidateId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async hasUserVoted(userId: number): Promise<boolean> {
    const [user] = await db.select({ hasVoted: users.hasVoted }).from(users).where(eq(users.id, userId));
    return user?.hasVoted || false;
  }

  // Face recognition operations
  async saveFaceData(userId: number, faceData: any): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ faceData, faceRegistered: true })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getFaceData(userId: number): Promise<any> {
    const [user] = await db
      .select({ faceData: users.faceData })
      .from(users)
      .where(eq(users.id, userId));
    return user?.faceData;
  }

  async isUserFaceRegistered(userId: number): Promise<boolean> {
    const [user] = await db
      .select({ faceRegistered: users.faceRegistered })
      .from(users)
      .where(eq(users.id, userId));
    return user?.faceRegistered || false;
  }

  // Session operations
  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    return session;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  // Candidate operations
  async getCandidates(): Promise<Candidate[]> {
    return await db.select().from(candidates);
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
    return candidate;
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const [candidate] = await db.insert(candidates).values(insertCandidate).returning();
    return candidate;
  }
  
  // Update a candidate (for admin functionality)
  async updateCandidate(id: number, candidateData: InsertCandidate): Promise<Candidate> {
    const [updatedCandidate] = await db
      .update(candidates)
      .set(candidateData)
      .where(eq(candidates.id, id))
      .returning();
      
    if (!updatedCandidate) {
      throw new Error("Candidate not found");
    }
    
    return updatedCandidate;
  }
  
  // Delete a candidate (for admin functionality)
  async deleteCandidate(id: number): Promise<void> {
    // Delete votes related to this candidate first
    await db.transaction(async (tx) => {
      await tx.delete(votes).where(eq(votes.candidateId, id));
      
      // Reset votedFor field for users who voted for this candidate
      await tx
        .update(users)
        .set({ 
          votedFor: null,
          // Don't reset hasVoted - users have still participated, even if 
          // their candidate is removed
        })
        .where(eq(users.votedFor, id));
      
      // Delete the candidate
      const result = await tx.delete(candidates).where(eq(candidates.id, id)).returning();
      
      if (result.length === 0) {
        throw new Error("Candidate not found");
      }
    });
  }

  // Vote operations
  async castVote(insertVote: InsertVote, userId?: number): Promise<Vote> {
    // Begin a transaction
    return await db.transaction(async (tx) => {
      // If userId is provided, check if user has voted and update user state
      if (userId) {
        const [user] = await tx.select().from(users).where(eq(users.id, userId));
        
        if (!user) {
          throw new Error("User not found");
        }
        
        if (user.hasVoted) {
          throw new Error("User has already voted");
        }
        
        // Update user to mark as voted
        await tx
          .update(users)
          .set({ hasVoted: true, votedFor: insertVote.candidateId })
          .where(eq(users.id, userId));
      }
      
      // Create the vote record
      const [vote] = await tx
        .insert(votes)
        .values({ ...insertVote, userId: userId || null })
        .returning();
      
      return vote;
    });
  }

  async getVotesForCandidate(candidateId: number): Promise<number> {
    const result = await db
      .select({ count: sqlExpr<number>`cast(count(*) as int)` })
      .from(votes)
      .where(eq(votes.candidateId, candidateId));
    return result[0]?.count || 0;
  }

  async getElectionResults(): Promise<ElectionSummary> {
    // Get all candidates
    const allCandidates = await this.getCandidates();
    
    // Get total votes
    const totalVotesResult = await db
      .select({ count: sqlExpr<number>`cast(count(*) as int)` })
      .from(votes);
    const totalVotes = totalVotesResult[0]?.count || 0;
    
    // Get votes for each candidate and build results
    const results: VoteResult[] = await Promise.all(
      allCandidates.map(async (candidate) => {
        const voteCount = await this.getVotesForCandidate(candidate.id);
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
        
        return {
          candidate,
          votes: voteCount,
          percentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
        };
      })
    );
    
    // Sort results by number of votes in descending order
    results.sort((a, b) => b.votes - a.votes);
    
    // Determine the leading candidate
    const leadingCandidate = results.length > 0 ? results[0] : undefined;
    
    return {
      totalVotes,
      results,
      leadingCandidate
    };
  }
}
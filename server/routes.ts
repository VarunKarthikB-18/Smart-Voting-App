import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVoteSchema, insertCandidateSchema, User } from "@shared/schema";
import { z } from "zod";
import { setupAuth, ensureAuthenticated } from './auth';

// Middleware to ensure the user is an admin
function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication with passport
  setupAuth(app);
  
  // Get all candidates
  app.get("/api/candidates", async (req: Request, res: Response) => {
    try {
      const candidates = await storage.getCandidates();
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve candidates" });
    }
  });

  // Get election results
  app.get("/api/results", async (req: Request, res: Response) => {
    try {
      const results = await storage.getElectionResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve election results" });
    }
  });

  // Cast a vote - requires authentication and face verification
  app.post("/api/vote", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate the vote data
      const validatedData = insertVoteSchema.parse(req.body);
      
      // Get the user from the request (passport puts the whole user object here)
      // ensureAuthenticated middleware guarantees user exists
      const currentUser = req.user!;
      const userId = currentUser.id;
      
      // Check if user is face-verified
      // In a production app, you would check a session flag that indicates 
      // the user has been face-verified for this specific voting session
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has already voted
      if (user.hasVoted) {
        return res.status(400).json({ message: "You have already cast your vote" });
      }
      
      // Store the vote with the user ID
      const vote = await storage.castVote(validatedData, userId);
      
      // Return the updated results
      const results = await storage.getElectionResults();
      res.json({ 
        message: "Vote cast successfully",
        vote,
        results
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to cast vote" });
      }
    }
  });

  // ======= ADMIN ROUTES =======
  
  // Get all voters (admin only)
  app.get("/api/admin/voters", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      // This assumes you've added a method to get all users
      const users = await storage.getAllUsers();
      
      // Filter out sensitive information
      const voters = users.map((user: User) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        hasVoted: user.hasVoted,
        votedFor: user.votedFor,
        role: user.role
      }));
      
      res.json(voters);
    } catch (error) {
      console.error("Error fetching voters:", error);
      res.status(500).json({ message: "Failed to fetch voters" });
    }
  });

  // Create a new candidate (admin only)
  app.post("/api/admin/candidates", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      // Validate the candidate data
      const validatedData = insertCandidateSchema.parse(req.body);
      
      // Create the candidate
      const candidate = await storage.createCandidate(validatedData);
      
      res.status(201).json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid candidate data", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create candidate" });
      }
    }
  });

  // Update a candidate (admin only)
  app.put("/api/admin/candidates/:id", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      
      // Validate the candidate data
      const validatedData = insertCandidateSchema.parse(req.body);
      
      // Check if candidate exists
      const candidate = await storage.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      // Update the candidate
      const updatedCandidate = await storage.updateCandidate(candidateId, validatedData);
      
      res.json(updatedCandidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid candidate data", errors: error.errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update candidate" });
      }
    }
  });

  // Delete a candidate (admin only)
  app.delete("/api/admin/candidates/:id", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const candidateId = parseInt(req.params.id);
      
      // Check if candidate exists
      const candidate = await storage.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      // Delete the candidate
      await storage.deleteCandidate(candidateId);
      
      res.json({ message: "Candidate deleted successfully" });
    } catch (error) {
      console.error("Error deleting candidate:", error);
      res.status(500).json({ message: "Failed to delete candidate" });
    }
  });

  // Initialize the HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}

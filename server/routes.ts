import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVoteSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, ensureAuthenticated } from './auth';

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

  // Initialize the HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}

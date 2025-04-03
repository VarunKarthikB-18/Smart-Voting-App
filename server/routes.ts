import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Cast a vote
  app.post("/api/vote", async (req: Request, res: Response) => {
    try {
      // Validate the vote data
      const validatedData = insertVoteSchema.parse(req.body);
      
      // Check if the client already voted (using session storage or cookies in a real app)
      const clientIp = req.ip;
      const clientId = req.headers["x-client-id"] as string || clientIp;
      
      // You could use a real session or database check here
      // For now, we're using the candidateId from the request to check if user already voted
      const hasVoted = req.cookies && req.cookies.hasVoted === 'true';
      
      if (hasVoted) {
        return res.status(400).json({ message: "You have already cast your vote" });
      }
      
      // Store the vote
      const vote = await storage.castVote(validatedData);
      
      // Set a cookie to indicate this client has voted
      res.cookie('hasVoted', 'true', { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
      });
      
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

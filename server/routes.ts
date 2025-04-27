import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVoteSchema, insertCandidateSchema, User } from "@shared/schema";
import { z } from "zod";
import { setupAuth, ensureAuthenticated } from './auth';
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import * as faceapi from "face-api.js";
import * as canvas from "canvas";
import * as path from "path";

// Configure face-api.js to use canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ 
  Canvas: Canvas as unknown as typeof HTMLCanvasElement,
  Image: Image as unknown as typeof HTMLImageElement,
  ImageData: ImageData as unknown as typeof globalThis.ImageData
});

declare global {
  namespace Express {
    interface User {
      id: number;
      role: string;
      faceRegistered: boolean;
    }
  }
}

// Load face-api.js models lazily with caching
let modelsLoaded = false;
let modelLoadPromise: Promise<void> | null = null;

async function loadFaceApiModels() {
  if (modelsLoaded) {
    console.log("Models already loaded, skipping...");
    return;
  }
  
  // If models are already being loaded, wait for that promise
  if (modelLoadPromise) {
    console.log("Models are currently loading, waiting...");
    await modelLoadPromise;
    return;
  }
  
  // Start loading models
  modelLoadPromise = (async () => {
    try {
      // Use the same CDN URL as the client
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
      console.log('Loading face recognition models from URL:', MODEL_URL);
      
      // Check if models exist
      if (!faceapi.nets.tinyFaceDetector.isLoaded) {
        console.log('Loading TinyFaceDetector model...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log('TinyFaceDetector model loaded successfully');
      }
      
      if (!faceapi.nets.faceLandmark68Net.isLoaded) {
        console.log('Loading FaceLandmark68 model...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log('FaceLandmark68 model loaded successfully');
      }
      
      if (!faceapi.nets.faceRecognitionNet.isLoaded) {
        console.log('Loading FaceRecognition model...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log('FaceRecognition model loaded successfully');
      }
      
      modelsLoaded = true;
      console.log('All face recognition models loaded successfully');
    } catch (error) {
      console.error('Error loading face recognition models:', error);
      modelsLoaded = false;
      modelLoadPromise = null;
      throw error;
    }
  })();
  
  await modelLoadPromise;
}

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
      
      // Get the user from the request
      const currentUser = req.user!;
      const userId = currentUser.id;
      
      // Get user data to check face registration status
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has registered their face
      if (!user.faceRegistered) {
        return res.status(400).json({ 
          message: "Face registration required",
          code: "FACE_REGISTRATION_REQUIRED"
        });
      }

      // Check if user has already voted
      if (user.hasVoted) {
        return res.status(400).json({ message: "You have already cast your vote" });
      }

      // Verify face before allowing vote
      const { faceDescriptor } = req.body;
      if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
        return res.status(400).json({ 
          message: "Face verification required",
          code: "FACE_VERIFICATION_REQUIRED"
        });
      }

      // Load face-api models if not already loaded
      await loadFaceApiModels();

      // Get stored face data
      const userData = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .get();

      if (!userData?.faceData) {
        return res.status(400).json({ message: "Face data not found" });
      }

      try {
        const storedFaceData = JSON.parse(userData.faceData as string);
        const storedDescriptor = new Float32Array(storedFaceData.descriptor);
        const newDescriptor = new Float32Array(faceDescriptor);

        // Compare face descriptors using Euclidean distance
        const distance = faceapi.euclideanDistance(storedDescriptor, newDescriptor);
        console.log("Vote face verification - Distance:", distance);
        const isMatch = distance < 0.45;

        if (!isMatch) {
          return res.status(401).json({ 
            message: "Face verification failed - The person attempting to vote does not match the registered face.",
            code: "FACE_VERIFICATION_FAILED"
          });
        }

        // If face verification passed, proceed with storing the vote
        const vote = await storage.castVote(validatedData, userId);
        
        // Return the updated results
        const results = await storage.getElectionResults();
        res.json({ 
          message: "Vote cast successfully",
          vote,
          results
        });
      } catch (verificationError) {
        console.error("Face verification error:", verificationError);
        return res.status(500).json({ 
          message: "Face verification failed",
          details: verificationError instanceof Error ? verificationError.message : "Unknown error"
        });
      }
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
      
      // Filter out sensitive information but include all necessary details
      const voters = users.map((user: User) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        hasVoted: user.hasVoted,
        votedFor: user.votedFor,
        role: user.role,
        createdAt: user.createdAt
      }));
      
      res.json(voters);
    } catch (error) {
      console.error("Error fetching voters:", error);
      res.status(500).json({ message: "Failed to fetch voters" });
    }
  });
  
  // Delete a user (admin only)
  app.delete("/api/admin/users/:id", ensureAuthenticated, ensureAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow deleting your own account or other admin accounts
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      if (user.role === 'admin' && req.user!.role === 'admin') {
        return res.status(400).json({ message: "Cannot delete another admin account" });
      }
      
      // Delete the user
      await storage.deleteUser(userId);
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
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

  // Face registration endpoint
  app.post("/api/face/register", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Starting face registration process...");
      await loadFaceApiModels(); // Load models before registration
      
      const user = req.user as Express.User;
      const { faceDescriptor, faceImage } = req.body;
      
      if (!faceDescriptor || !faceImage) {
        console.log("Missing face data in request");
        return res.status(400).json({ message: "Face data is required" });
      }

      // Validate face descriptor format
      if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
        console.log("Invalid face descriptor format");
        return res.status(400).json({ message: "Invalid face descriptor format" });
      }

      console.log("Updating user face data for user ID:", user.id);
      
      try {
        // Update user's face data and registration status
        await db.update(users)
          .set({ 
            faceRegistered: true,
            faceData: JSON.stringify({ descriptor: faceDescriptor, image: faceImage })
          })
          .where(eq(users.id, user.id))
          .run();

        // Get updated user data
        const updatedUser = await db.select()
          .from(users)
          .where(eq(users.id, user.id))
          .get();

        if (!updatedUser) {
          throw new Error("Failed to retrieve updated user data");
        }

        console.log("Face registration successful for user:", user.id);
        res.json(updatedUser);
      } catch (dbError) {
        console.error("Database error during face registration:", dbError);
        throw new Error("Failed to update user data in database");
      }
    } catch (error) {
      console.error("Face registration error:", error);
      res.status(500).json({ 
        message: "Failed to register face",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Face verification endpoint
  app.post("/api/face/verify", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Starting face verification process...");
      
      try {
        console.log("Loading face-api models...");
        await loadFaceApiModels();
        
        // Double check models are loaded
        const modelsAreLoaded = 
          faceapi.nets.tinyFaceDetector.isLoaded &&
          faceapi.nets.faceLandmark68Net.isLoaded &&
          faceapi.nets.faceRecognitionNet.isLoaded;
        
        console.log("Face-api models loaded status:", {
          tinyFaceDetector: faceapi.nets.tinyFaceDetector.isLoaded,
          faceLandmark68: faceapi.nets.faceLandmark68Net.isLoaded,
          faceRecognition: faceapi.nets.faceRecognitionNet.isLoaded
        });
        
        if (!modelsAreLoaded) {
          throw new Error("Face recognition models failed to load properly");
        }
      } catch (modelError) {
        console.error("Failed to load face-api models:", modelError);
        return res.status(500).json({ 
          message: "Failed to load face recognition models",
          details: modelError instanceof Error ? modelError.message : "Unknown error"
        });
      }
      
      const user = req.user as Express.User;
      const { faceDescriptor } = req.body;

      console.log("Received face verification request for user:", user.id);
      console.log("Face descriptor type:", typeof faceDescriptor);
      console.log("Face descriptor array?", Array.isArray(faceDescriptor));
      console.log("Face descriptor length:", faceDescriptor?.length);
      
      if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
        console.log("Invalid face descriptor in request:", {
          exists: !!faceDescriptor,
          isArray: Array.isArray(faceDescriptor),
          length: faceDescriptor?.length
        });
        return res.status(400).json({ message: "Invalid face descriptor format" });
      }

      const userData = await db.select()
        .from(users)
        .where(eq(users.id, user.id))
        .get();

      if (!userData) {
        console.log("User not found in database:", user.id);
        return res.status(404).json({ message: "User not found" });
      }

      if (!userData.faceRegistered || !userData.faceData) {
        console.log("User face not registered:", {
          userId: user.id,
          faceRegistered: userData.faceRegistered,
          hasFaceData: !!userData.faceData
        });
        return res.status(400).json({ message: "Face not registered" });
      }

      console.log("Retrieved stored face data for user:", user.id);

      try {
        // Get stored face data
        const storedFaceData = JSON.parse(userData.faceData as string);
        console.log("Parsed stored face data successfully");
        console.log("Stored face data type:", typeof storedFaceData);
        console.log("Stored descriptor type:", typeof storedFaceData.descriptor);
        console.log("Stored descriptor array?", Array.isArray(storedFaceData.descriptor));
        console.log("Stored descriptor length:", storedFaceData.descriptor?.length);

        if (!storedFaceData.descriptor || !Array.isArray(storedFaceData.descriptor) || storedFaceData.descriptor.length !== 128) {
          console.log("Invalid stored face descriptor:", {
            hasDescriptor: !!storedFaceData.descriptor,
            isArray: Array.isArray(storedFaceData.descriptor),
            length: storedFaceData.descriptor?.length
          });
          return res.status(400).json({ message: "Invalid stored face data" });
        }

        try {
          const storedDescriptor = new Float32Array(storedFaceData.descriptor);
          const newDescriptor = new Float32Array(faceDescriptor);

          console.log("Face descriptors prepared for comparison:", {
            storedLength: storedDescriptor.length,
            newLength: newDescriptor.length,
            storedType: storedDescriptor.constructor.name,
            newType: newDescriptor.constructor.name
          });

          // Compare face descriptors using Euclidean distance
          // Threshold explanation:
          // - 0.0 = Exact same face/photo
          // - 0.3-0.4 = Very likely same person
          // - 0.4-0.6 = Possibly same person
          // - >0.6 = Different people
          // We use 0.45 as a balanced threshold that prevents false positives while allowing for natural variations
          const distance = faceapi.euclideanDistance(storedDescriptor, newDescriptor);
          console.log("Face comparison distance:", distance);

          const isMatch = distance < 0.45;
          console.log("Face verification result:", isMatch ? "match" : "no match");

          if (isMatch) {
            res.json({ verified: true });
          } else {
            res.json({ verified: false, message: "Face verification failed" });
          }
        } catch (comparisonError) {
          console.error("Error during face comparison:", comparisonError);
          throw new Error("Failed to compare face descriptors");
        }
      } catch (parseError) {
        console.error("Error parsing or processing face data:", parseError);
        return res.status(500).json({ 
          message: "Error processing face data",
          details: parseError instanceof Error ? parseError.message : "Unknown error"
        });
      }
    } catch (error) {
      console.error("Face verification error:", error);
      res.status(500).json({ 
        message: "Failed to verify face",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Initialize the HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}

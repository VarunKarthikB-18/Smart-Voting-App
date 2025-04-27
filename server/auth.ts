import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users, sessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from 'bcrypt';
import Database from "better-sqlite3";
import SQLiteStore from "better-sqlite3-session-store";
import path from 'path';

declare global {
  namespace Express {
    interface User extends typeof users.$inferSelect {}
  }
}

const scryptAsync = promisify(scrypt);

// Hash password using scrypt and a random salt
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Verify a password against a stored hashed password
async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    // Handle bcrypt passwords (starting with $2b$)
    if (hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2a$')) {
      return await bcrypt.compare(plainPassword, hashedPassword);
    }
    
    // Handle our scrypt format
    if (hashedPassword.includes(".")) {
      const [hashed, salt] = hashedPassword.split(".");
      
      if (!hashed || !salt) {
        console.log("Missing hash or salt component");
        return false;
      }
      
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(plainPassword, salt, 64)) as Buffer;
      
      // Ensure both buffers have the same length before comparing
      if (hashedBuf.length !== suppliedBuf.length) {
        console.log("Buffer length mismatch:", hashedBuf.length, suppliedBuf.length);
        return false;
      }
      
      return timingSafeEqual(hashedBuf, suppliedBuf);
    }
    
    console.log("Unsupported password format");
    return false;
  } catch (error) {
    console.error("Error in password comparison:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Set up SQLite session store with absolute path
  const SQLiteStoreFactory = SQLiteStore(session);
  const sessionDB = new Database(path.join(process.cwd(), "sessions.db"), {
    verbose: console.log
  });
  
  // Session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "secure-voting-app-secret",
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStoreFactory({
      client: sessionDB,
      expired: {
        clear: true,
        intervalMs: 900000 //ms = 15min
      }
    }),
    cookie: {
      secure: false, // Set to false for development
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      httpOnly: true
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport local strategy for username/password auth
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = db.select().from(users).where(eq(users.username, username)).get();
        if (!user) {
          return done(null, false);
        }
        
        // Special case for admin users during development
        if (user.role === 'admin' && (password === 'admin123' || password === 'password123')) {
          console.log('Admin user logged in with development password');
          return done(null, user);
        }
        
        // Normal password check for other users
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Serialize user to the session
  passport.serializeUser((user, done) => done(null, user.id));

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = db.select().from(users).where(eq(users.id, id)).get();
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register route
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = db.select().from(users).where(eq(users.username, req.body.username)).get();
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = db.select().from(users).where(eq(users.email, req.body.email)).get();
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Create the user with a hashed password
      const result = db.insert(users).values({
        ...req.body,
        password: await hashPassword(req.body.password),
        hasVoted: 0,
        faceRegistered: 0,
        faceData: null,
        role: 'voter'
      }).run();

      const user = db.select().from(users).where(eq(users.id, result.lastInsertRowid)).get();

      // Log the user in automatically after registration
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login route
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Current user route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// Middleware to ensure a user is authenticated
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}